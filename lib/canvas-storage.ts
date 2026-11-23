import { del, get, put } from "@vercel/blob"

// Server-only: the canvas JSON lives in a private Vercel Blob store (one stable
// path per project, overwritten in place). Prisma keeps only the blob URL, in
// `Project.canvasJsonPath`. Neither the URL nor the token is ever sent to the
// client; the editor receives canvas JSON through the canvas API route.

export interface CanvasState {
  nodes: unknown[]
  edges: unknown[]
}

export const EMPTY_CANVAS: CanvasState = { nodes: [], edges: [] }

const canvasPath = (projectId: string) => `canvas/${projectId}.json`

// Uploads the canvas, replacing the previous blob, and returns the blob URL.
export async function saveCanvasBlob(projectId: string, json: string): Promise<string> {
  const blob = await put(canvasPath(projectId), json, {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
  })
  return blob.url
}

// Reads the saved canvas. `useCache: false` returns the latest write even right
// after a save. Any status other than 200 (or an unreadable body) means "nothing saved".
export async function readCanvasBlob(url: string): Promise<CanvasState | null> {
  const result = await get(url, { access: "private", useCache: false })
  if (!result || result.statusCode !== 200) return null

  try {
    const parsed = JSON.parse(await new Response(result.stream).text()) as Partial<CanvasState>
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) return null
    return { nodes: parsed.nodes, edges: parsed.edges }
  } catch {
    return null
  }
}

// Best effort: a blob failure must never block deleting a project.
export async function deleteCanvasBlob(url: string): Promise<void> {
  try {
    await del(url)
  } catch (error) {
    console.error("Failed to delete canvas blob", error)
  }
}
