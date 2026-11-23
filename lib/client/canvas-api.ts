import { GENERIC_ERROR, request } from "@/lib/client/request"

// Client-side wrappers for the canvas API route. The server owns the blob
// store; the browser only ever sees canvas JSON.

export interface SavedCanvas {
  nodes: unknown[]
  edges: unknown[]
}

interface CanvasResponse extends Partial<SavedCanvas> {
  error?: string
}

export async function loadCanvas(projectId: string): Promise<SavedCanvas> {
  const data = await request<CanvasResponse>(`/api/projects/${projectId}/canvas`)
  return { nodes: data.nodes ?? [], edges: data.edges ?? [] }
}

// `keepalive` lets the request finish while the tab is closing (browsers cap
// such bodies at about 64 KB, so a very large canvas may not make it).
export async function saveCanvas(
  projectId: string,
  canvas: SavedCanvas,
  options: { keepalive?: boolean } = {}
): Promise<void> {
  const response = await fetch(`/api/projects/${projectId}/canvas`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(canvas),
    keepalive: options.keepalive && JSON.stringify(canvas).length < 60_000,
  })
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? GENERIC_ERROR)
  }
}
