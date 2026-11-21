import { request } from "@/lib/client/request"
import type { Collaborator } from "@/lib/collaborators"

interface CollaboratorsResponse {
  collaborators?: Collaborator[]
  error?: string
}

// Client-side wrappers for the collaborator API routes.

function basePath(projectId: string): string {
  return `/api/projects/${projectId}/collaborators`
}

export async function fetchCollaborators(projectId: string): Promise<Collaborator[]> {
  const data = await request<CollaboratorsResponse>(basePath(projectId))
  return data.collaborators ?? []
}

export async function inviteCollaborator(
  projectId: string,
  email: string
): Promise<Collaborator[]> {
  const data = await request<CollaboratorsResponse>(basePath(projectId), "POST", { email })
  return data.collaborators ?? []
}

export async function removeCollaborator(
  projectId: string,
  collaboratorId: string
): Promise<void> {
  await request<CollaboratorsResponse>(`${basePath(projectId)}/${collaboratorId}`, "DELETE")
}
