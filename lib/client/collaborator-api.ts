import { request } from "@/lib/client/request"
import type { ShareData } from "@/lib/collaborators"

type ShareResponse = Partial<ShareData> & { error?: string }

// Client-side wrappers for the collaborator API routes.

const EMPTY_OWNER: ShareData["owner"] = { name: null, email: null, imageUrl: null }

function basePath(projectId: string): string {
  return `/api/projects/${projectId}/collaborators`
}

function toShareData(data: ShareResponse): ShareData {
  return { owner: data.owner ?? EMPTY_OWNER, collaborators: data.collaborators ?? [] }
}

export async function fetchShareData(projectId: string): Promise<ShareData> {
  return toShareData(await request<ShareResponse>(basePath(projectId)))
}

export async function inviteCollaborator(projectId: string, email: string): Promise<ShareData> {
  return toShareData(await request<ShareResponse>(basePath(projectId), "POST", { email }))
}

export async function removeCollaborator(
  projectId: string,
  collaboratorId: string
): Promise<void> {
  await request<ShareResponse>(`${basePath(projectId)}/${collaboratorId}`, "DELETE")
}
