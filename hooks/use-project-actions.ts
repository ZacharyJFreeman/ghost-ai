"use client"

import { useParams, useRouter } from "next/navigation"
import { useCallback, useState } from "react"

import { createProject, deleteProject, renameProject } from "@/lib/client/project-api"
import { errorMessage } from "@/lib/client/request"
import { buildRoomId, generateIdSuffix, slugify, type Project } from "@/lib/projects"

export type ProjectDialogState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "rename"; project: Project }
  | { type: "delete"; project: Project }

export function useProjectActions() {
  const router = useRouter()
  const { roomId: activeProjectId } = useParams<{ roomId?: string }>()

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
        const id = await createProject({ id: roomId, name: trimmed })
        close()
        router.push(`/editor/${id}`)
      } else if (dialog.type === "rename") {
        await renameProject(dialog.project.id, trimmed)
        close()
        router.refresh()
      } else {
        const { id } = dialog.project
        await deleteProject(id)
        close()
        if (id === activeProjectId) router.push("/editor")
        else router.refresh()
      }
    } catch (err) {
      setError(errorMessage(err))
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
