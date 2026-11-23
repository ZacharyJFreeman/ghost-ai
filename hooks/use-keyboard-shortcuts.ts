"use client"

import type { Edge, Node, ReactFlowInstance } from "@xyflow/react"
import { useEffect, useRef } from "react"

const ZOOM_DURATION = 200

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}

// Canvas-level shortcuts apply when focus is on the page body or inside the
// canvas, never on buttons, links, dialogs, or the sidebars.
function isCanvasTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return true
  if (target === document.body || target === document.documentElement) return true
  if (target.closest("button, a, [role='dialog'], [role='toolbar']")) return false
  return target.closest(".react-flow") !== null
}

function hasTextSelection() {
  return (window.getSelection()?.toString() ?? "") !== ""
}

// Each action returns true when it handled the key, so the browser default is
// only blocked when something happened.
interface KeyboardShortcutOptions<N extends Node, E extends Edge> {
  flow: ReactFlowInstance<N, E> | null
  undo: () => void
  redo: () => void
  onSelectAll?: () => boolean
  onCopy?: () => boolean
  onCut?: () => boolean
  onPaste?: () => boolean
  onDuplicate?: () => boolean
  onEditLabel?: () => boolean
  onEscape?: () => boolean
}

// Canvas shortcuts on window: +/= zoom in, - zoom out, Cmd/Ctrl+Z undo,
// Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y redo, Cmd/Ctrl+A select all, C copy, X cut,
// V paste, D duplicate, Enter edit the selected label, Escape leave pan mode.
// Ignored while typing in a text field. The hook only maps keys to the actions
// it is given; it does not touch the canvas state itself.
export function useKeyboardShortcuts<N extends Node, E extends Edge>({
  flow,
  undo,
  redo,
  ...actions
}: KeyboardShortcutOptions<N, E>) {
  // Kept in a ref so the window listener always calls the latest actions
  // without being re-attached on every render.
  const actionsRef = useRef(actions)
  useEffect(() => {
    actionsRef.current = actions
  })

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return

      const current = actionsRef.current
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
        } else if (!event.shiftKey && isCanvasTarget(event.target)) {
          let handled = false
          if (key === "a") handled = current.onSelectAll?.() ?? false
          else if (key === "c") handled = !hasTextSelection() && (current.onCopy?.() ?? false)
          else if (key === "x") handled = !hasTextSelection() && (current.onCut?.() ?? false)
          else if (key === "v") handled = current.onPaste?.() ?? false
          else if (key === "d") {
            current.onDuplicate?.()
            // Always block the browser's bookmark shortcut on the canvas.
            handled = true
          }
          if (handled) event.preventDefault()
        }
        return
      }

      if (event.altKey) return

      if (event.key === "Escape") {
        if (current.onEscape?.()) event.preventDefault()
        return
      }

      if (event.key === "Enter" && !event.shiftKey && !event.repeat && isCanvasTarget(event.target)) {
        if (current.onEditLabel?.()) event.preventDefault()
        return
      }

      if (!flow) return
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
