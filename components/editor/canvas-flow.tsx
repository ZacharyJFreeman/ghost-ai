"use client"

import "@xyflow/react/dist/style.css"

import { useLiveblocksFlow } from "@liveblocks/react-flow"
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  type ReactFlowInstance,
} from "@xyflow/react"
import { useCallback, useRef, type DragEvent } from "react"

import { CanvasNodeView } from "@/components/editor/canvas-node"
import { ShapePanel } from "@/components/editor/shape-panel"
import {
  CANVAS_SHAPES,
  DEFAULT_NODE_COLOR,
  SHAPE_DRAG_MIME,
  type CanvasEdge,
  type CanvasNode,
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
export function CanvasFlow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    })

  const flowRef = useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null)
  const nodeCounter = useRef(0)

  const handleDragOver = useCallback((event: DragEvent) => {
    if (!event.dataTransfer.types.includes(SHAPE_DRAG_MIME)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent) => {
      const payload = parseShapePayload(event.dataTransfer.getData(SHAPE_DRAG_MIME))
      const flow = flowRef.current
      if (!payload || !flow) return
      event.preventDefault()

      const position = flow.screenToFlowPosition({ x: event.clientX, y: event.clientY })
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

  return (
    <div
      className="relative size-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={(instance) => {
          flowRef.current = instance
        }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        connectionMode={ConnectionMode.Loose}
        colorMode="dark"
        fitView
        style={{ backgroundColor: "var(--bg-base)" }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="var(--border-subtle)" />
        <MiniMap
          pannable
          zoomable
          style={{ backgroundColor: "var(--bg-surface)" }}
          maskColor="color-mix(in srgb, var(--bg-base) 70%, transparent)"
        />
      </ReactFlow>
      <ShapePanel />
    </div>
  )
}
