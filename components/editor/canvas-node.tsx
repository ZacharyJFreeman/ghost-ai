"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"

import { NODE_COLORS, type CanvasNode } from "@/types/canvas"

// Basic renderer: every shape is a bordered rectangle with a centered label.
// Shape-specific visuals come later.
export function CanvasNodeView({ data }: NodeProps<CanvasNode>) {
  const text = NODE_COLORS.find((pair) => pair.fill === data.color)?.text ?? NODE_COLORS[0].text

  return (
    <div
      className="flex size-full items-center justify-center rounded-md border px-2 text-center text-sm"
      style={{ backgroundColor: data.color, color: text, borderColor: text }}
    >
      {data.label}
      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Left} id="left" />
    </div>
  )
}
