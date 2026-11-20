"use client"

import { useParams, useRouter } from "next/navigation"
import { useCallback, useState } from "react"

import { buildRoomId, generateIdSuffix, slugify, type Project } from "@/lib/projects"

export type ProjectDialogState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "rename"; project: Project }
  | { type: "delete"; project: Project }

interface ApiResponse {
  project?: { id: string }
  error?: string
}

const GENERIC_ERROR = "Something went wrong. Please try again."

async function request(url: string, method: string, body?: unknown): Promise<ApiResponse> {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = (await response.json().catch(() => ({}))) as ApiResponse
  if (!response.ok) throw new Error(data.error ?? GENERIC_ERROR)
  return data
}

export function useProjectActions() {
  const router = useRouter()
  const { projectId: activeProjectId } = useParams<{ projectId?: string }>()

  const [dialog, setDialog] = useState<ProjectDialogState>({ type: "closed" })
  const [name, setName] = useState("")
  const [suffix, setSuffix] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const slug = slugify(name)
  const roomId = slug ? buildRoomId(slug, suffix) : ""

  const close = useCallback(() => {
    setDialog({ type: "closed" })
    setName("")
    setError(null)
    setIsLoading(false)
  }, [])

  const openCreate = useCallback(() => {
    setName("")
    setError(null)
    setSuffix(generateIdSuffix())
    setDialog({ type: "create" })
  }, [])

  const openRename = useCallback((project: Project) => {
    setName(project.name)
    setError(null)
    setDialog({ type: "rename", project })
  }, [])

  const openDelete = useCallback((project: Project) => {
    setError(null)
    setDialog({ type: "delete", project })
  }, [])

  const submit = useCallback(async () => {
    if (isLoading || dialog.type === "closed") return
    const trimmed = name.trim()
    if (dialog.type !== "delete" && !slugify(trimmed)) return

    setIsLoading(true)
    setError(null)

    try {
      if (dialog.type === "create") {
        const { project } = await request("/api/projects", "POST", {
          id: roomId,
          name: trimmed,
        })
        close()
        router.push(`/editor/${project?.id ?? roomId}`)
      } else if (dialog.type === "rename") {
        await request(`/api/projects/${dialog.project.id}`, "PATCH", { name: trimmed })
        close()
        router.refresh()
      } else {
        const { id } = dialog.project
        await request(`/api/projects/${id}`, "DELETE")
        close()
        if (id === activeProjectId) router.push("/editor")
        else router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : GENERIC_ERROR)
      setIsLoading(false)
    }
  }, [isLoading, dialog, name, roomId, activeProjectId, router, close])

  return {
    dialog,
    name,
    setName,
    slug,
    roomId,
    isLoading,
    error,
    openCreate,
    openRename,
    openDelete,
    close,
    submit,
  }
}
