"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { saveCanvas, type SavedCanvas } from "@/lib/client/canvas-api"

export type SaveStatus = "idle" | "saving" | "saved" | "error"

const SAVE_DEBOUNCE_MS = 2000
const RESULT_VISIBLE_MS = 2000

interface CanvasLike {
  nodes: readonly object[]
  edges: readonly object[]
}

// Keep only what defines the canvas. Transient React Flow fields (selection,
// measured size, dragging) are dropped so selecting a node never triggers a save.
function normalize({ nodes, edges }: CanvasLike): SavedCanvas {
  return {
    nodes: nodes.map((node) => {
      const n = node as Record<string, unknown>
      return {
        id: n.id,
        type: n.type,
        position: n.position,
        width: n.width,
        height: n.height,
        data: n.data,
      }
    }),
    edges: edges.map((edge) => {
      const e = edge as Record<string, unknown>
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        type: e.type,
        data: e.data,
      }
    }),
  }
}

const isEmpty = (canvas: SavedCanvas) => canvas.nodes.length === 0 && canvas.edges.length === 0

// Autosaves the canvas through the canvas API route.
// - Nothing saves until `markLoaded()` is called (the load step finished).
// - An empty canvas is never saved, so it cannot overwrite a saved one.
// - Saves are debounced and skipped when the canvas is unchanged since the last save.
// - `saveNow()` and a hidden or closing tab flush immediately.
export function useCanvasAutosave(projectId: string, canvas: CanvasLike) {
  const [status, setStatus] = useState<SaveStatus>("idle")
  const [isLoaded, setIsLoaded] = useState(false)

  const latest = useRef<SavedCanvas>({ nodes: [], edges: [] })
  const lastSaved = useRef<string | null>(null)
  const inFlight = useRef(false)
  const rerun = useRef(false)
  const persistRef = useRef<(keepalive?: boolean) => Promise<void>>(async () => {})

  const current = normalize(canvas)
  const serialized = JSON.stringify(current)

  // Refs are updated after render (not during it) so timers and flushes read the newest canvas.
  useEffect(() => {
    latest.current = current
  })

  const persist = useCallback(
    async (keepalive = false) => {
      if (inFlight.current) {
        rerun.current = true
        return
      }
      const snapshot = latest.current
      const snapshotKey = JSON.stringify(snapshot)
      if (isEmpty(snapshot) || snapshotKey === lastSaved.current) return

      inFlight.current = true
      setStatus("saving")
      try {
        await saveCanvas(projectId, snapshot, { keepalive })
        lastSaved.current = snapshotKey
        setStatus("saved")
      } catch {
        setStatus("error")
      } finally {
        inFlight.current = false
        if (rerun.current) {
          rerun.current = false
          void persistRef.current()
        }
      }
    },
    [projectId]
  )

  useEffect(() => {
    persistRef.current = persist
  }, [persist])

  // Call once the load step is done. Pass the state that was loaded from the
  // server so it is not immediately saved back unchanged.
  const markLoaded = useCallback((loaded?: CanvasLike) => {
    if (loaded) lastSaved.current = JSON.stringify(normalize(loaded))
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    const timer = setTimeout(() => void persist(), SAVE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [isLoaded, serialized, persist])

  useEffect(() => {
    if (!isLoaded) return
    const flush = () => void persist(true)
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush()
    }
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pagehide", flush)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pagehide", flush)
    }
  }, [isLoaded, persist])

  // "saved" and "error" are brief confirmations: return to idle so the Save button resets.
  useEffect(() => {
    if (status !== "saved" && status !== "error") return
    const timer = setTimeout(() => setStatus("idle"), RESULT_VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [status])

  const saveNow = useCallback(() => {
    if (isLoaded) void persist()
  }, [isLoaded, persist])

  return { status, saveNow, markLoaded }
}
