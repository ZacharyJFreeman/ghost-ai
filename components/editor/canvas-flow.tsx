"use client"

import "@xyflow/react/dist/style.css"

import { useCanRedo, useCanUndo, useRedo, useRoom, useUndo, useUpdateMyPresence } from "@liveblocks/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  type ReactFlowInstance,
} from "@xyflow/react"
import { ChevronDown, ChevronUp } from "lucide-react"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
  type RefObject,
} from "react"

import { CanvasControls } from "@/components/editor/canvas-controls"
import { CanvasNodeView } from "@/components/editor/canvas-node"
import { LiveCursors } from "@/components/editor/live-cursors"
import { ShapePanel } from "@/components/editor/shape-panel"
import { CANVAS_TEMPLATES } from "@/components/editor/starter-templates"
import { useCanvasAutosave, type SaveStatus } from "@/hooks/use-canvas-autosave"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
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

  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  const updateMyPresence = useUpdateMyPresence()

  useKeyboardShortcuts({ flow, undo, redo })

  const roomId = useRoom().id
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

  const addShapeNode = useCallback(
    (payload: ShapeDragPayload, clientX: number, clientY: number) => {
      const flow = flowRef.current
      if (!flow) return

      // screenToFlowPosition already handles the container rect, pan and zoom.
      // Node size is in flow units, so half of it centers the node on the cursor.
      const cursor = flow.screenToFlowPosition({ x: clientX, y: clientY })
      const position = { x: cursor.x - payload.width / 2, y: cursor.y - payload.height / 2 }
      nodeCounter.current += 1

      const node: CanvasNode = {
        id: `${payload.shape}-${Date.now()}-${nodeCounter.current}`,
        type: "canvasNode",
        position,
        width: payload.width,
        height: payload.height,
        data: { label: "", color: DEFAULT_NODE_COLOR.fill, shape: payload.shape },
      }
      onNodesChange([{ type: "add", item: node }])
    },
    [onNodesChange],
  )

  // Delete/Backspace removes the selected nodes and edges through the Liveblocks
  // `onDelete` mutation (its `remove` changes are no-ops), so the removal syncs to
  // everyone. Edges attached to a removed node go with it. Selection is read from the React Flow store. Listens on
  // window because focus is often on the page body after a click; ignored while
  // typing in a field.
  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Delete" && event.key !== "Backspace") return
      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return
      }
      if (!flow) return

      const selectedNodes = flow.getNodes().filter((node) => node.selected)
      const selectedNodeIds = new Set(selectedNodes.map((node) => node.id))
      const deletedEdges = flow
        .getEdges()
        .filter(
          (edge) =>
            edge.selected || selectedNodeIds.has(edge.source) || selectedNodeIds.has(edge.target),
        )
      if (selectedNodes.length === 0 && deletedEdges.length === 0) return

      event.preventDefault()
      void onDelete({ nodes: selectedNodes, edges: deletedEdges })
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [flow, onDelete])

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
        connectionMode={ConnectionMode.Loose}
        colorMode="dark"
        deleteKeyCode={null}
        style={{ backgroundColor: "var(--bg-base)" }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="var(--border-subtle)" />
        <LiveCursors />
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
