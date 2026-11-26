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
