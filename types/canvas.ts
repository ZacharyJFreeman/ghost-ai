import type { Edge, Node } from "@xyflow/react"

export const CANVAS_SHAPES = ["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"] as const

export type CanvasShape = (typeof CANVAS_SHAPES)[number]

export interface NodeColor {
  fill: string
  text: string
}

// The 8 node color pairs from ui-context.md: a dark fill with a vivid text color.
export const NODE_COLORS: readonly NodeColor[] = [
  { fill: "#1F1F1F", text: "#EDEDED" }, // neutral dark (default)
  { fill: "#10233D", text: "#52A8FF" }, // blue
  { fill: "#2E1938", text: "#BF7AF0" }, // purple
  { fill: "#331B00", text: "#FF990A" }, // orange
  { fill: "#3C1618", text: "#FF6166" }, // red
  { fill: "#3A1726", text: "#F75F8F" }, // pink
  { fill: "#0F2E18", text: "#62C073" }, // green
  { fill: "#062822", text: "#0AC7B4" }, // teal
]

export const DEFAULT_NODE_COLOR: NodeColor = NODE_COLORS[0]

// React Flow requires node data to be a plain record, so this is a type alias.
export type CanvasNodeData = {
  label: string
  // The node fill from NODE_COLORS; its text color is looked up from the pair.
  color: string
  shape: CanvasShape
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">

export type CanvasEdge = Edge<Record<string, unknown>, "canvasEdge">

export interface ShapeSize {
  width: number
  height: number
}

// Default node size per shape: rectangles are wider than tall, circles are
// square, and diamonds are larger so labels have room.
export const DEFAULT_SHAPE_SIZES: Record<CanvasShape, ShapeSize> = {
  rectangle: { width: 160, height: 80 },
  diamond: { width: 140, height: 140 },
  circle: { width: 100, height: 100 },
  pill: { width: 160, height: 64 },
  cylinder: { width: 120, height: 120 },
  hexagon: { width: 140, height: 120 },
}

// The payload carried by a shape dragged from the shape panel.
export interface ShapeDragPayload {
  shape: CanvasShape
  width: number
  height: number
}

export const SHAPE_DRAG_MIME = "application/x-ghost-ai-shape"
