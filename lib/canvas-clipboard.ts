import type { CanvasEdge, CanvasNode, CanvasShape } from "@/types/canvas"

// In-memory clipboard for canvas shapes. It lives at module level, so it is
// per browser tab; nothing is synced or written to the system clipboard.

export const PASTE_OFFSET = 24

export interface ClipboardData {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

let clipboard: ClipboardData | null = null
let pasteCount = 0

export function setClipboard(data: ClipboardData) {
  clipboard = data
  pasteCount = 0
}

export function getClipboard() {
  return clipboard
}

// Each repeated paste of the same copy lands one step further along.
export function nextPasteOffset() {
  pasteCount += 1
  return PASTE_OFFSET * pasteCount
}

// Copies the selected nodes and only the edges that connect two selected nodes
// (an edge's own `selected` flag is not used: React Flow also selects edges that
// touch a selected node). Builds plain copies so transient fields (selected,
// measured, dragging) are never carried over.
export function snapshotSelection(nodes: CanvasNode[], edges: CanvasEdge[]): ClipboardData | null {
  const selected = nodes.filter((node) => node.selected)
  if (selected.length === 0) return null
  const ids = new Set(selected.map((node) => node.id))

  return {
    nodes: selected.map((node) => {
      const copy: CanvasNode = {
        id: node.id,
        type: "canvasNode",
        position: { ...node.position },
        data: { ...node.data },
      }
      const width = node.width ?? node.measured?.width
      const height = node.height ?? node.measured?.height
      if (width !== undefined) copy.width = width
      if (height !== undefined) copy.height = height
      return copy
    }),
    edges: edges
      .filter((edge) => ids.has(edge.source) && ids.has(edge.target))
      .map((edge) => {
        const copy: CanvasEdge = { id: edge.id, source: edge.source, target: edge.target }
        if (edge.sourceHandle !== undefined) copy.sourceHandle = edge.sourceHandle
        if (edge.targetHandle !== undefined) copy.targetHandle = edge.targetHandle
        if (edge.type !== undefined) copy.type = edge.type
        if (edge.data !== undefined) copy.data = { ...edge.data }
        return copy
      }),
  }
}

// New nodes (new ids, moved by `offset`, selected) and edges remapped to those
// ids. An edge whose end was not copied never exists in the clipboard, so no
// pasted line dangles. Edge ids use the same format as lines drawn by hand, so
// drawing the same connection later replaces the pasted line instead of
// doubling it.
export function buildPaste(
  data: ClipboardData,
  offset: number,
  makeNodeId: (shape: CanvasShape) => string,
): ClipboardData {
  const idMap = new Map<string, string>()

  const nodes = data.nodes.map((node) => {
    const id = makeNodeId(node.data.shape)
    idMap.set(node.id, id)
    return {
      ...node,
      id,
      position: { x: node.position.x + offset, y: node.position.y + offset },
      data: { ...node.data },
      selected: true,
    }
  })

  const edges = data.edges.flatMap((edge) => {
    const source = idMap.get(edge.source)
    const target = idMap.get(edge.target)
    if (!source || !target) return []
    return [
      {
        ...edge,
        id: `xy-edge__${source}${edge.sourceHandle ?? ""}-${target}${edge.targetHandle ?? ""}`,
        source,
        target,
      },
    ]
  })

  return { nodes, edges }
}
