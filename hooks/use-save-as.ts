"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState, type RefObject } from "react"

import { saveCanvas, type SavedCanvas } from "@/lib/client/canvas-api"
import { createProject, deleteProject } from "@/lib/client/project-api"
import { errorMessage } from "@/lib/client/request"
import { buildRoomId, generateIdSuffix, slugify } from "@/lib/projects"

const CANVAS_COPY_ERROR = "Couldn't copy the canvas into the new project. Try again."

// UI state for "Save as": a dialog that names a new project and fills it with a
// copy of the canvas currently on screen (including edits that are not saved
// yet). `getCanvasRef` is set by the canvas and returns the live canvas.
export function useSaveAs(sourceName: string, getCanvasRef: RefObject<(() => SavedCanvas) | null>) {
  const router = useRouter()

  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [suffix, setSuffix] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const slug = slugify(name)
  const roomId = slug ? buildRoomId(slug, suffix) : ""

  const open = useCallback(() => {
    setName(`${sourceName} copy`)
    setSuffix(generateIdSuffix())
    setError(null)
    setIsOpen(true)
  }, [sourceName])

  const close = useCallback(() => {
    setIsOpen(false)
    setError(null)
    setIsLoading(false)
  }, [])

  const submit = useCallback(async () => {
    const trimmed = name.trim()
    if (isLoading || !slugify(trimmed)) return

    const canvas = getCanvasRef.current?.()
    if (!canvas) {
      setError("The canvas isn't ready yet. Try again in a moment.")
      return
    }

    setIsLoading(true)
    setError(null)

    let createdId: string | null = null
    try {
      createdId = await createProject({ id: roomId, name: trimmed })
      // An empty canvas has nothing to copy; the new project just starts blank.
      if (canvas.nodes.length > 0 || canvas.edges.length > 0) {
        await saveCanvas(createdId, canvas)
      }
      close()
      router.push(`/editor/${createdId}`)
    } catch (err) {
      // Never leave a half-made project behind: if the project was created but its
      // canvas could not be copied, remove it again (best effort).
      if (createdId) {
        await deleteProject(createdId).catch(() => {})
        setError(CANVAS_COPY_ERROR)
      } else {
        setError(errorMessage(err))
      }
      setIsLoading(false)
    }
  }, [name, isLoading, roomId, getCanvasRef, close, router])

  return { isOpen, name, setName, slug, roomId, isLoading, error, open, close, submit }
}
