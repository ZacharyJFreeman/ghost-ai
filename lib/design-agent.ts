// Pure logic for the design agent (no network): the action schema the model
// fills in, the prompt, and the planner that turns the model's actions into
// validated canvas operations. The planner enforces the allowed shapes, the
// node color palette, and the layout and spacing rules, so a bad model answer
// can never put an off-palette or overlapping node on the shared canvas.
//
// Imports are relative (not "@/") because the Trigger.dev bundler loads this.
import {
  CANVAS_SHAPES,
  DEFAULT_NODE_COLOR,
  DEFAULT_SHAPE_SIZES,
  NODE_COLORS,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeData,
  type CanvasShape,
} from "../types/canvas"

export const ACTION_TYPES = [
  "add_node",
  "move_node",
  "resize_node",
  "update_node_data",
  "delete_node",
  "add_edge",
  "delete_edge",
] as const

export type ActionType = (typeof ACTION_TYPES)[number]

// Palette colors are chosen by name; the planner maps them to NODE_COLORS.
export const COLOR_NAMES = ["neutral", "blue", "purple", "orange", "red", "pink", "green", "teal"] as const

export type ColorName = (typeof COLOR_NAMES)[number]

const HANDLES = ["top", "right", "bottom", "left"] as const

type Handle = (typeof HANDLES)[number]

// Layout and spacing rules (canvas units).
export const GRID = 20
export const NODE_GAP = 60
export const COLUMN_GAP = 120
export const MIN_WIDTH = 60
export const MIN_HEIGHT = 40
export const MAX_WIDTH = 480
export const MAX_HEIGHT = 360
export const MAX_ACTIONS = 80
const MAX_LABEL_LENGTH = 60

// What the model returns: a flat action list. Which fields apply depends on `type`.
export interface RawAction {
  type?: unknown
  id?: unknown
  shape?: unknown
  label?: unknown
  color?: unknown
  x?: unknown
  y?: unknown
  width?: unknown
  height?: unknown
  source?: unknown
  target?: unknown
  sourceHandle?: unknown
  targetHandle?: unknown
}

export interface DesignOutput {
  summary: string
  actions: RawAction[]
}

// JSON schema handed to the model for structured output.
export const DESIGN_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "One or two sentences describing what was designed or changed." },
    actions: {
      type: "array",
      description: "Canvas actions, in the order they should be applied.",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: [...ACTION_TYPES] },
          id: {
            type: "string",
            description:
              "add_node: a short unique temporary id other actions can refer to. move/resize/update/delete_node: the id of an existing or just-added node. delete_edge: the id of an existing edge.",
          },
          shape: { type: "string", enum: [...CANVAS_SHAPES] },
          label: { type: "string", description: "Node text, 60 characters or fewer." },
          color: { type: "string", enum: [...COLOR_NAMES] },
          x: { type: "number", description: "Left edge of the node in canvas units." },
          y: { type: "number", description: "Top edge of the node in canvas units." },
          width: { type: "number" },
          height: { type: "number" },
          source: { type: "string", description: "add_edge/delete_edge: the node id the line starts at." },
          target: { type: "string", description: "add_edge/delete_edge: the node id the line ends at." },
          sourceHandle: { type: "string", enum: [...HANDLES] },
          targetHandle: { type: "string", enum: [...HANDLES] },
        },
        required: ["type"],
      },
    },
  },
  required: ["summary", "actions"],
} as const

export const DESIGN_SYSTEM_PROMPT = `You are Ghost AI, an architecture design agent that edits a shared system design canvas.
Turn the user's request into canvas actions. Return only the structured output.

Actions: add_node, move_node, resize_node, update_node_data, delete_node, add_edge, delete_edge.
- add_node needs id (a short temporary id), shape, label, color, x, y. Width and height are optional.
- Reference existing nodes by the ids in the canvas snapshot, and new nodes by the temporary ids you chose.
- add_edge needs source and target (a line with an arrowhead from source to target); handles are optional.
- Only change what the request needs. When the canvas already has content, extend or edit it instead of rebuilding it.

Allowed node shapes: ${CANVAS_SHAPES.join(", ")}.
- rectangle: services and applications; pill: clients, users and external actors; cylinder: databases and storage;
  hexagon: gateways, queues and brokers; circle: small events or triggers; diamond: decisions.

Color palette (use these names only): ${COLOR_NAMES.join(", ")}.
- neutral for clients and generic parts, blue for gateways and entry points, purple for services, orange for queues
  and async work, red for security or failure paths, pink for third parties, green for caches and healthy paths,
  teal for databases and storage. Keep one color per kind of component.

Layout and spacing rules:
- Flow left to right: clients on the left, then gateways, services, and data stores on the right.
- Place nodes of the same tier in one column; start columns at x = 0 and step by at least ${COLUMN_GAP} units more than the widest node in the previous column.
- Stack nodes in a column at least ${NODE_GAP} units apart vertically. Use multiples of ${GRID} for x and y.
- Nodes must never overlap. Keep the design compact, usually 5 to 15 nodes.
- Labels are short (a few words).`

export interface CanvasSnapshotNode {
  id: string
  shape: string
  label: string
  color: string
  x: number
  y: number
  width: number
  height: number
}

export interface CanvasSnapshotEdge {
  id: string
  source: string
  target: string
}

function colorName(fill: string): ColorName {
  const index = NODE_COLORS.findIndex((color) => color.fill.toLowerCase() === fill.toLowerCase())
  return COLOR_NAMES[index === -1 ? 0 : index]
}

function size(node: CanvasNode): { width: number; height: number } {
  const fallback = DEFAULT_SHAPE_SIZES[node.data?.shape] ?? DEFAULT_SHAPE_SIZES.rectangle
  return { width: node.width ?? node.measured?.width ?? fallback.width, height: node.height ?? node.measured?.height ?? fallback.height }
}

// A compact view of the canvas for the prompt.
export function snapshotCanvas(nodes: readonly CanvasNode[], edges: readonly CanvasEdge[]) {
  return {
    nodes: nodes.map<CanvasSnapshotNode>((node) => ({
      id: node.id,
      shape: node.data?.shape ?? "rectangle",
      label: node.data?.label ?? "",
      color: colorName(node.data?.color ?? DEFAULT_NODE_COLOR.fill),
      x: Math.round(node.position.x),
      y: Math.round(node.position.y),
      ...size(node),
    })),
    edges: edges.map<CanvasSnapshotEdge>((edge) => ({ id: edge.id, source: edge.source, target: edge.target })),
  }
}

export function buildPrompt(userPrompt: string, canvas: ReturnType<typeof snapshotCanvas>): string {
  return `Current canvas (JSON):\n${JSON.stringify(canvas)}\n\nUser request:\n${userPrompt}`
}

// A validated operation, ready to apply to the shared flow.
interface OperationBase {
  description: string
  // Where the AI cursor points while this is applied (null keeps it where it was).
  focus: { x: number; y: number } | null
}

export type DesignOperation = OperationBase &
  (
    | { kind: "add_node"; node: CanvasNode }
    | { kind: "move_node"; id: string; position: { x: number; y: number } }
    | { kind: "resize_node"; id: string; width: number; height: number }
    | { kind: "update_node_data"; id: string; data: Partial<CanvasNodeData> }
    | { kind: "delete_node"; id: string }
    | { kind: "add_edge"; edge: CanvasEdge }
    | { kind: "delete_edge"; id: string }
  )

function centerOf(node: CanvasNode): { x: number; y: number } {
  const { width, height } = size(node)
  return { x: node.position.x + width / 2, y: node.position.y + height / 2 }
}

function snap(value: number): number {
  return Math.round(value / GRID) * GRID
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function asShape(value: unknown): CanvasShape | undefined {
  return typeof value === "string" && (CANVAS_SHAPES as readonly string[]).includes(value) ? (value as CanvasShape) : undefined
}

function asFill(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const index = (COLOR_NAMES as readonly string[]).indexOf(value)
  return index === -1 ? undefined : NODE_COLORS[index].fill
}

function asHandle(value: unknown, fallback: Handle): Handle {
  return typeof value === "string" && (HANDLES as readonly string[]).includes(value) ? (value as Handle) : fallback
}

function cleanLabel(value: unknown): string | undefined {
  const label = asString(value)
  return label ? label.slice(0, MAX_LABEL_LENGTH) : undefined
}

function overlaps(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    a.x < b.x + b.width + NODE_GAP &&
    a.x + a.width + NODE_GAP > b.x &&
    a.y < b.y + b.height + NODE_GAP &&
    a.y + a.height + NODE_GAP > b.y
  )
}

// Snaps to the grid and pushes the rectangle down until it clears every other node by NODE_GAP.
function place(
  x: number,
  y: number,
  width: number,
  height: number,
  others: readonly CanvasNode[],
): { x: number; y: number } {
  const rect = { x: snap(x), y: snap(y), width, height }
  for (let attempt = 0; attempt < 100; attempt++) {
    const hit = others.find((other) => overlaps(rect, { ...other.position, ...size(other) }))
    if (!hit) break
    // Round up so snapping never eats into the gap.
    rect.y = Math.ceil((hit.position.y + size(hit).height + NODE_GAP) / GRID) * GRID
  }
  return { x: rect.x, y: rect.y }
}

export interface PlanResult {
  operations: DesignOperation[]
  skipped: number
}

// Validates the model's actions against a working copy of the canvas and
// returns the operations to apply. Invalid actions are skipped, not fatal.
export function planOperations(
  actions: readonly RawAction[],
  existingNodes: readonly CanvasNode[],
  existingEdges: readonly CanvasEdge[],
  idSuffix: string,
): PlanResult {
  const nodes = new Map(existingNodes.map((node) => [node.id, node]))
  const edges = new Map(existingEdges.map((edge) => [edge.id, edge]))
  const tempIds = new Map<string, string>()
  const operations: DesignOperation[] = []
  let skipped = 0
  let counter = 0

  const resolve = (value: unknown): string | undefined => {
    const id = asString(value)
    if (!id) return undefined
    const resolved = tempIds.get(id) ?? id
    return nodes.has(resolved) ? resolved : undefined
  }

  for (const action of actions.slice(0, MAX_ACTIONS)) {
    const type = action?.type

    if (type === "add_node") {
      const shape = asShape(action.shape) ?? "rectangle"
      const defaults = DEFAULT_SHAPE_SIZES[shape]
      const width = clamp(asNumber(action.width) ?? defaults.width, MIN_WIDTH, MAX_WIDTH)
      const height = clamp(asNumber(action.height) ?? defaults.height, MIN_HEIGHT, MAX_HEIGHT)
      const rightEdge = [...nodes.values()].reduce((max, node) => Math.max(max, node.position.x + size(node).width), -COLUMN_GAP)
      const position = place(asNumber(action.x) ?? rightEdge + COLUMN_GAP, asNumber(action.y) ?? 0, width, height, [...nodes.values()])
      const label = cleanLabel(action.label) ?? "Untitled"
      const node: CanvasNode = {
        id: `ai-${idSuffix}-${counter++}`,
        type: "canvasNode",
        position,
        width,
        height,
        data: { label, color: asFill(action.color) ?? DEFAULT_NODE_COLOR.fill, shape },
      }
      const tempId = asString(action.id)
      if (tempId) tempIds.set(tempId, node.id)
      nodes.set(node.id, node)
      operations.push({ kind: "add_node", node, description: `Adding ${label}`, focus: centerOf(node) })
    } else if (type === "move_node") {
      const id = resolve(action.id)
      const x = asNumber(action.x)
      const y = asNumber(action.y)
      const current = id ? nodes.get(id) : undefined
      if (!id || !current || x === undefined || y === undefined) {
        skipped++
        continue
      }
      const others = [...nodes.values()].filter((node) => node.id !== id)
      const position = place(x, y, size(current).width, size(current).height, others)
      nodes.set(id, { ...current, position })
      operations.push({ kind: "move_node", id, position, description: `Moving ${current.data.label}`, focus: position })
    } else if (type === "resize_node") {
      const id = resolve(action.id)
      const current = id ? nodes.get(id) : undefined
      const width = asNumber(action.width)
      const height = asNumber(action.height)
      if (!id || !current || (width === undefined && height === undefined)) {
        skipped++
        continue
      }
      const next = {
        width: clamp(width ?? size(current).width, MIN_WIDTH, MAX_WIDTH),
        height: clamp(height ?? size(current).height, MIN_HEIGHT, MAX_HEIGHT),
      }
      const resized = { ...current, ...next }
      nodes.set(id, resized)
      operations.push({ kind: "resize_node", id, ...next, description: `Resizing ${current.data.label}`, focus: centerOf(resized) })
    } else if (type === "update_node_data") {
      const id = resolve(action.id)
      const current = id ? nodes.get(id) : undefined
      const data: Partial<CanvasNodeData> = {}
      const label = cleanLabel(action.label)
      const shape = asShape(action.shape)
      const color = asFill(action.color)
      if (label) data.label = label
      if (shape) data.shape = shape
      if (color) data.color = color
      if (!id || !current || Object.keys(data).length === 0) {
        skipped++
        continue
      }
      nodes.set(id, { ...current, data: { ...current.data, ...data } })
      operations.push({ kind: "update_node_data", id, data, description: `Updating ${current.data.label}`, focus: centerOf(current) })
    } else if (type === "delete_node") {
      const id = resolve(action.id)
      const current = id ? nodes.get(id) : undefined
      if (!id || !current) {
        skipped++
        continue
      }
      // Deleting a shape breaks every line attached to it.
      for (const edge of [...edges.values()]) {
        if (edge.source !== id && edge.target !== id) continue
        edges.delete(edge.id)
        operations.push({ kind: "delete_edge", id: edge.id, description: "Removing a connection", focus: centerOf(current) })
      }
      nodes.delete(id)
      operations.push({ kind: "delete_node", id, description: `Removing ${current.data.label}`, focus: centerOf(current) })
    } else if (type === "add_edge") {
      const source = resolve(action.source)
      const target = resolve(action.target)
      if (!source || !target) {
        skipped++
        continue
      }
      const sourceHandle = asHandle(action.sourceHandle, "right")
      const targetHandle = asHandle(action.targetHandle, "left")
      // Same id format as a line drawn by hand, so the same connection is one line.
      const edge: CanvasEdge = {
        id: `xy-edge__${source}${sourceHandle}-${target}${targetHandle}`,
        source,
        target,
        sourceHandle,
        targetHandle,
      }
      if (edges.has(edge.id)) {
        skipped++
        continue
      }
      edges.set(edge.id, edge)
      operations.push({
        kind: "add_edge",
        edge,
        description: `Connecting ${nodes.get(source)?.data.label} to ${nodes.get(target)?.data.label}`,
        focus: centerOf(nodes.get(target)!),
      })
    } else if (type === "delete_edge") {
      const id = asString(action.id)
      const source = resolve(action.source)
      const target = resolve(action.target)
      const found =
        (id ? edges.get(id) : undefined) ??
        (source && target ? [...edges.values()].find((edge) => edge.source === source && edge.target === target) : undefined)
      if (!found) {
        skipped++
        continue
      }
      edges.delete(found.id)
      operations.push({ kind: "delete_edge", id: found.id, description: "Removing a connection", focus: null })
    } else {
      skipped++
    }
  }

  return { operations, skipped }
}
