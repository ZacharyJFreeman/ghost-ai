"use client"

import "@xyflow/react/dist/style.css"

import { useCanRedo, useCanUndo, useRedo, useRoom, useUndo, useUpdateMyPresence } from "@liveblocks/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  SelectionMode,
  type DefaultEdgeOptions,
  type EdgeChange,
  type NodeChange,
  type ReactFlowInstance,
} from "@xyflow/react"
import { ChevronDown, ChevronUp } from "lucide-react"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type MouseEvent,
  type RefObject,
} from "react"

import { CanvasControls } from "@/components/editor/canvas-controls"
import { CanvasEdgeView } from "@/components/editor/canvas-edge"
import { CanvasNodeView } from "@/components/editor/canvas-node"
import { LiveCursors } from "@/components/editor/live-cursors"
import { ShapePanel } from "@/components/editor/shape-panel"
import { CANVAS_TEMPLATES } from "@/components/editor/starter-templates"
import { useCanvasAutosave, type SaveStatus } from "@/hooks/use-canvas-autosave"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import {
  buildPaste,
  getClipboard,
  nextPasteOffset,
  setClipboard,
  snapshotSelection,
} from "@/lib/canvas-clipboard"
import { requestNodeEdit } from "@/lib/canvas-edit-request"
import { loadCanvas } from "@/lib/client/canvas-api"
import { takePendingTemplate } from "@/lib/pending-template"
import {
  CANVAS_SHAPES,
  DEFAULT_NODE_COLOR,
  DEFAULT_SHAPE_SIZES,
  SHAPE_DRAG_MIME,
  type CanvasEdge,
  type CanvasNode,
  type CanvasShape,
  type ShapeDragPayload,
} from "@/types/canvas"

const nodeTypes = { canvasNode: CanvasNodeView }

// Replaces React Flow's default edge (same bezier path) so any line can show a
// text label. Edges have no `type`, so they all resolve to "default".
const edgeTypes = { default: CanvasEdgeView }

// Every line ends in an arrowhead at its target (the end it was dropped on).
// React Flow merges these options into every edge when it renders, so drawn,
// saved, template, split and pasted lines all get it without storing anything.
const ARROW_SIZE = 37.5 // React Flow's default is 12.5; this is 3x larger.
const defaultEdgeOptions: DefaultEdgeOptions = {
  markerEnd: { type: MarkerType.ArrowClosed, width: ARROW_SIZE, height: ARROW_SIZE },
  interactionWidth: 20,
}

// Mouse buttons that pan: 0 left, 1 middle, 2 right. Select mode keeps the left
// button for the selection box; pan mode adds it. Never `true`, which would
// break right-drag panning and context-menu handling.
const SELECT_MODE_PAN_BUTTONS = [1, 2]
const PAN_MODE_PAN_BUTTONS = [0, 1, 2]

// A double-click on a line starts with a single click, so the split waits this
// long and is cancelled by the double-click.
const EDGE_SPLIT_DELAY_MS = 250

// Theme through React Flow's own CSS variables, using existing tokens. The
// arrowhead (`defaultMarkerColor={null}`) follows the same stroke variable.
const flowStyle = {
  backgroundColor: "var(--bg-base)",
  "--xy-edge-stroke": "var(--text-muted)",
  "--xy-edge-stroke-selected": "var(--text-secondary)",
  "--xy-selection-background-color": "var(--accent-primary-dim)",
  "--xy-selection-border": "1px solid color-mix(in srgb, var(--accent-primary) 60%, transparent)",
} as CSSProperties

function parseShapePayload(raw: string): ShapeDragPayload | null {
  try {
    const value = JSON.parse(raw) as Partial<ShapeDragPayload>
    if (
      CANVAS_SHAPES.includes(value.shape as ShapeDragPayload["shape"]) &&
      typeof value.width === "number" &&
      typeof value.height === "number"
    ) {
      return value as ShapeDragPayload
    }
  } catch {
    // Not our payload.
  }
  return null
}

// React Flow wired to Liveblocks Storage: nodes and edges are shared by
// everyone in the room. Must render inside a RoomProvider and Suspense.
interface CanvasFlowProps {
  // Lets the workspace navbar show the save status and trigger a save.
  onSaveStatusChange?: (status: SaveStatus) => void
  saveNowRef?: RefObject<(() => void) | null>
}

export function CanvasFlow({ onSaveStatusChange, saveNowRef }: CanvasFlowProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    })

  const flowRef = useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const nodeCounter = useRef(0)
  const [selectedShape, setSelectedShape] = useState<CanvasShape | null>(null)
  const [flow, setFlow] = useState<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null)
  const [miniMapOpen, setMiniMapOpen] = useState(true)
  // Pan mode (hand tool) is local UI state: left-drag pans instead of selecting.
  const [panMode, setPanMode] = useState(false)
  const splitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  const updateMyPresence = useUpdateMyPresence()

  const room = useRoom()
  const roomId = room.id
  const { status, saveNow, markLoaded } = useCanvasAutosave(roomId, { nodes, edges })

  useEffect(() => {
    onSaveStatusChange?.(status)
  }, [status, onSaveStatusChange])

  useEffect(() => {
    if (!saveNowRef) return
    saveNowRef.current = saveNow
    return () => {
      saveNowRef.current = null
    }
  }, [saveNow, saveNowRef])

  // Load the saved canvas once, only into a room that is still empty. A room
  // that already has content (active collaboration) is never overwritten.
  // Autosave stays off until this decision is made; if loading fails it stays
  // off, so a partial canvas can never replace the saved one.
  const loadStarted = useRef(false)
  useEffect(() => {
    if (!flow || loadStarted.current) return
    loadStarted.current = true

    if (nodes.length > 0 || edges.length > 0) {
      markLoaded()
      // The ReactFlow `fitView` prop is off (it zoomed in on the first dropped
      // node), so fit once here for a room that already has content.
      requestAnimationFrame(() => void flow.fitView({ duration: 200 }))
      return
    }

    loadCanvas(roomId)
      .then((saved) => {
        const hasSaved = saved.nodes.length > 0 || saved.edges.length > 0
        const stillEmpty = flow.getNodes().length === 0 && flow.getEdges().length === 0
        if (hasSaved && stillEmpty) {
          onNodesChange((saved.nodes as CanvasNode[]).map((item) => ({ type: "add", item })))
          onEdgesChange((saved.edges as CanvasEdge[]).map((item) => ({ type: "add", item })))
          markLoaded({ nodes: saved.nodes as object[], edges: saved.edges as object[] })
          requestAnimationFrame(() => void flow.fitView({ duration: 200 }))
        } else {
          markLoaded()
        }
      })
      .catch(() => {
        // Leave autosave off rather than risk overwriting the saved canvas.
      })
  }, [flow, roomId, nodes, edges, onNodesChange, onEdgesChange, markLoaded])

  // A template picked in the create-project dialog is added once, to a canvas
  // that is still empty, then the view is fitted to it.
  useEffect(() => {
    if (!flow) return
    const templateId = takePendingTemplate(roomId)
    const template = CANVAS_TEMPLATES.find((item) => item.id === templateId)
    if (!template || flow.getNodes().length > 0) return
    onNodesChange(template.nodes.map((item) => ({ type: "add", item })))
    onEdgesChange(template.edges.map((item) => ({ type: "add", item })))
    requestAnimationFrame(() => void flow.fitView({ duration: 200 }))
  }, [flow, roomId, onNodesChange, onEdgesChange])

  const makeNodeId = useCallback((shape: CanvasShape) => {
    nodeCounter.current += 1
    return `${shape}-${Date.now()}-${nodeCounter.current}`
  }, [])

  const addShapeNode = useCallback(
    (payload: ShapeDragPayload, clientX: number, clientY: number) => {
      const flow = flowRef.current
      if (!flow) return

      // screenToFlowPosition already handles the container rect, pan and zoom.
      // Node size is in flow units, so half of it centers the node on the cursor.
      const cursor = flow.screenToFlowPosition({ x: clientX, y: clientY })
      const position = { x: cursor.x - payload.width / 2, y: cursor.y - payload.height / 2 }

      const node: CanvasNode = {
        id: makeNodeId(payload.shape),
        type: "canvasNode",
        position,
        width: payload.width,
        height: payload.height,
        data: { label: "", color: DEFAULT_NODE_COLOR.fill, shape: payload.shape },
      }
      onNodesChange([{ type: "add", item: node }])
    },
    [makeNodeId, onNodesChange],
  )

  // Removes the selected nodes and edges through the Liveblocks `onDelete`
  // mutation (its `remove` changes are no-ops), so the removal syncs to everyone
  // and undoes as one step. Every edge attached to a removed node goes with it
  // (links are broken); nodes that are not selected are never removed. Selection
  // is read from the React Flow store. Returns true when something was deleted.
  const deleteSelection = useCallback((): boolean => {
    if (!flow) return false

    const selectedNodes = flow.getNodes().filter((node) => node.selected)
    const selectedNodeIds = new Set(selectedNodes.map((node) => node.id))
    const deletedEdges = flow
      .getEdges()
      .filter(
        (edge) =>
          edge.selected || selectedNodeIds.has(edge.source) || selectedNodeIds.has(edge.target),
      )
    if (selectedNodes.length === 0 && deletedEdges.length === 0) return false

    void onDelete({ nodes: selectedNodes, edges: deletedEdges })
    return true
  }, [flow, onDelete])

  // Delete/Backspace deletes the selection. Listens on window because focus is
  // often on the page body after a click; ignored while typing in a field.
  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Delete" && event.key !== "Backspace") return
      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
          // Never delete shapes from behind an open dialog (e.g. the shortcuts popup).
          target.closest("[role='dialog']"))
      ) {
        return
      }
      if (deleteSelection()) event.preventDefault()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [deleteSelection])

  // Select all uses local-only `select` changes: nothing syncs and no undo step
  // is recorded.
  const selectAll = useCallback((): boolean => {
    if (!flow) return false
    onNodesChange(flow.getNodes().map((node) => ({ type: "select" as const, id: node.id, selected: true })))
    onEdgesChange(flow.getEdges().map((edge) => ({ type: "select" as const, id: edge.id, selected: true })))
    return true
  }, [flow, onNodesChange, onEdgesChange])

  const copySelection = useCallback((): boolean => {
    if (!flow) return false
    const snapshot = snapshotSelection(flow.getNodes(), flow.getEdges())
    if (!snapshot) return false
    setClipboard(snapshot)
    return true
  }, [flow])

  const cutSelection = useCallback((): boolean => {
    if (!copySelection()) return false
    return deleteSelection()
  }, [copySelection, deleteSelection])

  // Pastes the copied shapes as the new selection, in one batch: one undo step,
  // one message to collaborators. Nothing happens with an empty clipboard.
  const pasteClipboard = useCallback((): boolean => {
    const copied = getClipboard()
    if (!flow || !copied) return false

    const pasted = buildPaste(copied, nextPasteOffset(), makeNodeId)
    const nodeChanges: NodeChange<CanvasNode>[] = [
      ...flow
        .getNodes()
        .filter((node) => node.selected)
        .map((node) => ({ type: "select" as const, id: node.id, selected: false })),
      ...pasted.nodes.map((item) => ({ type: "add" as const, item })),
    ]
    const edgeChanges: EdgeChange<CanvasEdge>[] = [
      ...flow
        .getEdges()
        .filter((edge) => edge.selected)
        .map((edge) => ({ type: "select" as const, id: edge.id, selected: false })),
      ...pasted.edges.map((item) => ({ type: "add" as const, item })),
    ]
    room.batch(() => {
      onNodesChange(nodeChanges)
      onEdgesChange(edgeChanges)
    })
    return true
  }, [flow, room, makeNodeId, onNodesChange, onEdgesChange])

  const duplicateSelection = useCallback((): boolean => {
    if (!copySelection()) return false
    return pasteClipboard()
  }, [copySelection, pasteClipboard])

  // Enter opens the label editor of the one selected shape.
  const editSelectedLabel = useCallback((): boolean => {
    if (!flow) return false
    const selectedNodes = flow.getNodes().filter((node) => node.selected)
    if (selectedNodes.length !== 1) return false
    requestNodeEdit(selectedNodes[0].id)
    return true
  }, [flow])

  const exitPanMode = useCallback((): boolean => {
    if (!panMode) return false
    setPanMode(false)
    return true
  }, [panMode])

  useKeyboardShortcuts({
    flow,
    undo,
    redo,
    onSelectAll: selectAll,
    onCopy: copySelection,
    onCut: cutSelection,
    onPaste: pasteClipboard,
    onDuplicate: duplicateSelection,
    onEditLabel: editSelectedLabel,
    onEscape: exitPanMode,
  })

  const clearSplitTimer = useCallback(() => {
    if (splitTimer.current === null) return
    clearTimeout(splitTimer.current)
    splitTimer.current = null
  }, [])

  // A pending label never outlives the canvas.
  useEffect(() => clearSplitTimer, [clearSplitTimer])

  // Gives a line a text box over its middle. Runs after the delay, so it re-reads
  // the line: if it is gone (deleted) or already has a label, nothing happens. The
  // label is just `data.label` on the edge (one edge update, one undo step), not a
  // new shape. The empty label then opens its text box for typing (a local
  // one-shot request); `CanvasEdgeView` removes the label again if it stays empty.
  const addEdgeLabel = useCallback((edgeId: string) => {
    const instance = flowRef.current
    const edge = instance?.getEdge(edgeId)
    if (!instance || !edge || typeof edge.data?.label === "string") return
    requestNodeEdit(edge.id)
    instance.updateEdgeData(edge.id, { label: "" })
  }, [])

  // React Flow calls this for both clicks of a double-click. Each click cancels
  // the pending label; only a first click (detail 1) arms a new one.
  const handleEdgeClick = useCallback(
    (event: MouseEvent, edge: CanvasEdge) => {
      if (selectedShape) return
      if (event.shiftKey || event.metaKey || event.ctrlKey) return
      clearSplitTimer()
      if (event.detail > 1) return
      splitTimer.current = setTimeout(() => {
        splitTimer.current = null
        addEdgeLabel(edge.id)
      }, EDGE_SPLIT_DELAY_MS)
    },
    [selectedShape, clearSplitTimer, addEdgeLabel],
  )

  // Double-clicking a line deletes only that line; the shapes stay.
  const handleEdgeDoubleClick = useCallback(
    (_event: MouseEvent, edge: CanvasEdge) => {
      clearSplitTimer()
      void onDelete({ nodes: [], edges: [edge] })
    },
    [clearSplitTimer, onDelete],
  )

  // React Flow has no pane double-click prop, so this listens on the wrapper and
  // only acts when the empty pane itself was hit (not a shape, line, or control).
  const handleDoubleClick = useCallback(
    (event: MouseEvent) => {
      if (selectedShape) return
      if (!(event.target as Element).classList.contains("react-flow__pane")) return
      setPanMode((on) => !on)
    },
    [selectedShape],
  )

  const handleDragOver = useCallback((event: DragEvent) => {
    if (!event.dataTransfer.types.includes(SHAPE_DRAG_MIME)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent) => {
      const payload = parseShapePayload(event.dataTransfer.getData(SHAPE_DRAG_MIME))
      if (!payload) return
      event.preventDefault()
      addShapeNode(payload, event.clientX, event.clientY)
    },
    [addShapeNode],
  )

  // With a shape highlighted, the next click inside the canvas places it.
  const handleCanvasClick = useCallback(
    (event: MouseEvent) => {
      if (!selectedShape) return
      const target = event.target as Element
      if (target.closest("[data-shape-panel], [data-canvas-control], .react-flow__minimap")) return
      addShapeNode(
        { shape: selectedShape, ...DEFAULT_SHAPE_SIZES[selectedShape] },
        event.clientX,
        event.clientY,
      )
      setSelectedShape(null)
    },
    [selectedShape, addShapeNode],
  )

  // A click anywhere outside the canvas resets the highlight.
  useEffect(() => {
    if (!selectedShape) return
    function reset(event: globalThis.MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setSelectedShape(null)
    }
    document.addEventListener("click", reset)
    return () => document.removeEventListener("click", reset)
  }, [selectedShape])

  return (
    <div
      ref={wrapperRef}
      className="relative size-full"
      onClick={handleCanvasClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={(instance) => {
          flowRef.current = instance
          setFlow(instance)
        }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        onMouseMove={(event) => {
          const position = flowRef.current?.screenToFlowPosition({ x: event.clientX, y: event.clientY })
          if (position) updateMyPresence({ cursor: position })
        }}
        onMouseLeave={() => updateMyPresence({ cursor: null })}
        onEdgeClick={handleEdgeClick}
        onEdgeDoubleClick={handleEdgeDoubleClick}
        onDoubleClick={handleDoubleClick}
        connectionMode={ConnectionMode.Loose}
        colorMode="dark"
        deleteKeyCode={null}
        // Dragging empty canvas draws a selection box; middle/right-drag pans.
        // Pan mode (double-click the canvas) makes left-drag pan too.
        selectionOnDrag={!panMode}
        panOnDrag={panMode ? PAN_MODE_PAN_BUTTONS : SELECT_MODE_PAN_BUTTONS}
        selectionMode={SelectionMode.Partial}
        zoomOnDoubleClick={false}
        defaultEdgeOptions={defaultEdgeOptions}
        defaultMarkerColor={null}
        style={flowStyle}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="var(--border-subtle)" />
        <LiveCursors />
        {panMode && (
          <Panel
            position="top-center"
            role="status"
            className="pointer-events-none rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground shadow-lg"
          >
            Pan mode · double-click or press Esc to exit
          </Panel>
        )}
        {miniMapOpen && (
          <MiniMap
            pannable
            zoomable
            style={{ backgroundColor: "var(--bg-surface)" }}
            maskColor="color-mix(in srgb, var(--bg-base) 70%, transparent)"
          />
        )}
      </ReactFlow>
      <button
        type="button"
        data-canvas-control
        title={miniMapOpen ? "Collapse mini map" : "Show mini map"}
        aria-label={miniMapOpen ? "Collapse mini map" : "Show mini map"}
        onClick={() => setMiniMapOpen((open) => !open)}
        className={`absolute right-4 z-10 flex size-8 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-muted-foreground shadow-lg transition-colors hover:bg-accent-dim hover:text-foreground ${
          miniMapOpen ? "bottom-[178px]" : "bottom-4"
        }`}
      >
        {miniMapOpen ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
      </button>
      <ShapePanel selected={selectedShape} onSelect={setSelectedShape}>
        <CanvasControls
          onZoomIn={() => void flow?.zoomIn({ duration: 200 })}
          onZoomOut={() => void flow?.zoomOut({ duration: 200 })}
          onFitView={() => void flow?.fitView({ duration: 200 })}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      </ShapePanel>
    </div>
  )
}
