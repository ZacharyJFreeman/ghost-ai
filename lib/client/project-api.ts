import { request } from "@/lib/client/request"

interface ProjectResponse {
  project?: { id: string }
  error?: string
}

// Client-side wrappers for the project API routes.

export async function createProject(input: { id: string; name: string }): Promise<string> {
  const { project } = await request<ProjectResponse>("/api/projects", "POST", input)
  return project?.id ?? input.id
}

export async function renameProject(projectId: string, name: string): Promise<void> {
  await request<ProjectResponse>(`/api/projects/${projectId}`, "PATCH", { name })
}

export async function deleteProject(projectId: string): Promise<void> {
  await request<ProjectResponse>(`/api/projects/${projectId}`, "DELETE")
}
