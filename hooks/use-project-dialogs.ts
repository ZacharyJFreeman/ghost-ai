"use client"

import { useCallback, useState } from "react"

import { MOCK_PROJECTS, slugify, type Project } from "@/lib/projects"

export type ProjectDialogState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "rename"; project: Project }
  | { type: "delete"; project: Project }

const MOCK_LATENCY_MS = 400

export function useProjectDialogs() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS)
  const [dialog, setDialog] = useState<ProjectDialogState>({ type: "closed" })
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const slug = slugify(name)

  const close = useCallback(() => {
    setDialog({ type: "closed" })
    setName("")
    setIsLoading(false)
  }, [])

  const openCreate = useCallback(() => {
    setName("")
    setDialog({ type: "create" })
  }, [])

  const openRename = useCallback((project: Project) => {
    setName(project.name)
    setDialog({ type: "rename", project })
  }, [])

  const openDelete = useCallback((project: Project) => {
    setDialog({ type: "delete", project })
  }, [])

  const submit = useCallback(async () => {
    if (isLoading || dialog.type === "closed") return
    const trimmed = name.trim()
    if (dialog.type !== "delete" && !slugify(trimmed)) return

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

    if (dialog.type === "create") {
      setProjects((prev) => [
        ...prev,
        { id: crypto.randomUUID(), name: trimmed, slug: slugify(trimmed), isOwner: true },
      ])
    } else if (dialog.type === "rename") {
      const { id } = dialog.project
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: trimmed, slug: slugify(trimmed) } : p))
      )
    } else {
      const { id } = dialog.project
      setProjects((prev) => prev.filter((p) => p.id !== id))
    }

    close()
  }, [isLoading, dialog, name, close])

  return {
    projects,
    dialog,
    name,
    setName,
    slug,
    isLoading,
    openCreate,
    openRename,
    openDelete,
    close,
    submit,
  }
}
