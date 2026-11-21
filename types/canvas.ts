import type { Edge, Node } from "@xyflow/react"

export const CANVAS_SHAPES = ["rectangle", "circle", "diamond", "cylinder"] as const

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
