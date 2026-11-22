"use client"

import type { Edge, Node, ReactFlowInstance } from "@xyflow/react"
import { useEffect } from "react"

const ZOOM_DURATION = 200

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}

interface KeyboardShortcutOptions<N extends Node, E extends Edge> {
  flow: ReactFlowInstance<N, E> | null
  undo: () => void
  redo: () => void
}

// Canvas shortcuts on window: +/= zoom in, - zoom out, Cmd/Ctrl+Z undo,
// Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y redo. Ignored while typing in a text field.
export function useKeyboardShortcuts<N extends Node, E extends Edge>({
  flow,
  undo,
  redo,
}: KeyboardShortcutOptions<N, E>) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return

      const key = event.key.toLowerCase()
      const mod = event.ctrlKey || event.metaKey

      if (mod && !event.altKey) {
        if (key === "z") {
          event.preventDefault()
          if (event.shiftKey) redo()
          else undo()
        } else if (key === "y" && !event.shiftKey) {
          event.preventDefault()
          redo()
        }
        return
      }

      if (event.altKey || !flow) return
      if (key === "+" || key === "=") {
        event.preventDefault()
        void flow.zoomIn({ duration: ZOOM_DURATION })
      } else if (key === "-") {
        event.preventDefault()
        void flow.zoomOut({ duration: ZOOM_DURATION })
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [flow, undo, redo])
}
