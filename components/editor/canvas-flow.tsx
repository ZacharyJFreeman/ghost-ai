"use client"

import "@xyflow/react/dist/style.css"

import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { Background, BackgroundVariant, ConnectionMode, MiniMap, ReactFlow } from "@xyflow/react"

import type { CanvasEdge, CanvasNode } from "@/types/canvas"

// React Flow wired to Liveblocks Storage: nodes and edges are shared by
// everyone in the room. Must render inside a RoomProvider and Suspense.
export function CanvasFlow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    })

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
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
  )
}
