"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"

import { NODE_COLORS, type CanvasNode, type CanvasShape } from "@/types/canvas"

// Shapes drawn as an SVG outline stretched to the size of the node (viewBox 100x100).
const SVG_SHAPES: Partial<Record<CanvasShape, string[]>> = {
  diamond: ["M50,0 L100,50 L50,100 L0,50 Z"],
  hexagon: ["M25,0 L75,0 L100,50 L75,100 L25,100 L0,50 Z"],
  cylinder: [
    "M0,12 A50,12 0 0 1 100,12 L100,88 A50,12 0 0 1 0,88 Z",
    "M0,12 A50,12 0 0 0 100,12",
  ],
}

// Shapes drawn with a bordered div and a corner radius.
const BOX_RADIUS: Partial<Record<CanvasShape, string>> = {
  rectangle: "0.375rem",
  circle: "9999px",
  pill: "9999px",
}

export function CanvasNodeView({ data }: NodeProps<CanvasNode>) {
  const text = NODE_COLORS.find((pair) => pair.fill === data.color)?.text ?? NODE_COLORS[0].text
  const paths = SVG_SHAPES[data.shape]

  return (
    <div
      className="relative flex size-full items-center justify-center px-3 text-center text-sm"
      style={
        paths
          ? { color: text }
          : {
              color: text,
              backgroundColor: data.color,
              border: `1px solid ${text}`,
              borderRadius: BOX_RADIUS[data.shape],
            }
      }
    >
      {paths && (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
        >
          {paths.map((d, index) => (
            <path
              key={d}
              d={d}
              fill={index === 0 ? data.color : "none"}
              stroke={text}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      )}
      <span className="relative">{data.label}</span>
      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Left} id="left" />
    </div>
  )
}
