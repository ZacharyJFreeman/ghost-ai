import { GENERIC_ERROR, request } from "@/lib/client/request"

// Client-side wrappers for the spec routes. The browser never touches Blob: the
// list route returns metadata and the download route returns the file after an
// access check, so both the preview and the download go through it.

export interface SpecSummary {
  id: string
  filename: string
  createdAt: string
}

interface SpecListResponse {
  specs?: SpecSummary[]
  error?: string
}

const downloadUrl = (projectId: string, specId: string) =>
  `/api/projects/${projectId}/specs/${specId}/download`

export async function listSpecs(projectId: string): Promise<SpecSummary[]> {
  const data = await request<SpecListResponse>(`/api/projects/${projectId}/specs`)
  return data.specs ?? []
}

async function fetchSpecFile(projectId: string, specId: string): Promise<Response> {
  const response = await fetch(downloadUrl(projectId, specId))
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? GENERIC_ERROR)
  }
  return response
}

// The spec's Markdown as text, for the preview.
export async function fetchSpecMarkdown(projectId: string, specId: string): Promise<string> {
  return (await fetchSpecFile(projectId, specId)).text()
}

// Fetches the file, then hands it to the browser as a download named after the spec.
export async function downloadSpec(projectId: string, spec: SpecSummary): Promise<void> {
  const blob = await (await fetchSpecFile(projectId, spec.id)).blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = spec.filename
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

// Starts a spec generation run for the room (the room ID is the project ID) and
// returns its run ID. The canvas and chat are what the spec is written from.
export async function startSpecRun(
  roomId: string,
  chatHistory: { sender: string; text: string }[],
  canvas: { nodes: unknown[]; edges: unknown[] },
): Promise<string> {
  const data = await request<{ runId?: string; error?: string }>("/api/ai/spec", "POST", {
    roomId,
    chatHistory,
    nodes: canvas.nodes,
    edges: canvas.edges,
  })
  if (!data.runId) throw new Error("The spec run could not be started.")
  return data.runId
}

// A token that can read only this run (1 hour), for following it in real time.
export async function fetchSpecRunToken(runId: string): Promise<string> {
  const data = await request<{ token?: string; error?: string }>("/api/ai/spec/token", "POST", { runId })
  if (!data.token) throw new Error("The spec run could not be followed.")
  return data.token
}
