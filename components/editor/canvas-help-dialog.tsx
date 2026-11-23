"use client"

import type { ReactNode } from "react"

import { AppDialog } from "@/components/app/app-dialog"

interface KeyRow {
  // Alternative key combinations, e.g. ["Cmd/Ctrl + Z"] or ["Delete", "Backspace"].
  keys: string[]
  action: string
}

interface GestureRow {
  gesture: string
  action: string
}

const KEYBOARD: KeyRow[] = [
  { keys: ["+", "="], action: "Zoom in" },
  { keys: ["-"], action: "Zoom out" },
  { keys: ["Cmd/Ctrl + Z"], action: "Undo" },
  { keys: ["Cmd/Ctrl + Shift + Z", "Cmd/Ctrl + Y"], action: "Redo" },
  { keys: ["Delete", "Backspace"], action: "Delete the selection and every line attached to it" },
  { keys: ["Cmd/Ctrl + A"], action: "Select all shapes and lines" },
  { keys: ["Cmd/Ctrl + C"], action: "Copy the selected shapes and the lines between them" },
  { keys: ["Cmd/Ctrl + X"], action: "Cut (copy, then delete)" },
  { keys: ["Cmd/Ctrl + V"], action: "Paste (each repeat is offset further)" },
  { keys: ["Cmd/Ctrl + D"], action: "Duplicate the selection" },
  { keys: ["Enter"], action: "Edit the label of the one selected shape" },
  { keys: ["Esc"], action: "Leave pan mode, or stop editing a label" },
]

const MOUSE: GestureRow[] = [
  { gesture: "Drag on empty canvas", action: "Draw a selection box (every shape it touches is selected)" },
  { gesture: "Middle or right-drag", action: "Pan" },
  { gesture: "Scroll wheel or pinch", action: "Zoom" },
  { gesture: "Double-click empty canvas", action: "Turn pan mode on or off (left-drag pans while on)" },
  { gesture: "Click empty canvas", action: "Clear the selection" },
  { gesture: "Drag a selected shape", action: "Move the whole group; its lines follow" },
  { gesture: "Drag from a shape's handle", action: "Draw a line (the arrow points to where you drop it)" },
  { gesture: "Click a line", action: "Add an editable text box over it" },
  { gesture: "Click a line's text box", action: "Edit the text (clear it to remove the box)" },
  { gesture: "Double-click a line", action: "Delete the line" },
  { gesture: "Shift, Cmd or Ctrl-click a line", action: "Select the line without adding a text box" },
  { gesture: "Cmd/Ctrl-click a shape", action: "Add it to the selection" },
  { gesture: "Double-click a shape's label", action: "Edit the label" },
  { gesture: "Click a shape in the bottom bar, then click the canvas", action: "Place that shape" },
  { gesture: "Drag a shape from the bottom bar", action: "Drop it on the canvas" },
]

const BUILT_IN: GestureRow[] = [
  { gesture: "Shift + drag", action: "Also draws a selection box" },
  { gesture: "Hold Space + drag", action: "Pan" },
  { gesture: "Arrow keys", action: "Nudge a focused, selected shape" },
]

function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border border-surface-border bg-base px-1.5 py-0.5 font-mono text-xs text-copy-primary">
      {children}
    </kbd>
  )
}

// "Cmd/Ctrl + Shift + Z" renders as three keys joined by "+".
function KeyCombo({ combo }: { combo: string }) {
  const parts = combo.split(" + ")
  return (
    <span className="inline-flex items-center gap-1">
      {parts.map((part, index) => (
        <span key={part} className="inline-flex items-center gap-1">
          {index > 0 && <span className="text-xs text-copy-muted">+</span>}
          <Key>{part}</Key>
        </span>
      ))}
    </span>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2">
      <h3 className="text-xs font-medium tracking-wider text-copy-muted uppercase">{title}</h3>
      <dl className="grid gap-1.5">{children}</dl>
    </section>
  )
}

function Row({ term, children }: { term: ReactNode; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start gap-3 rounded-xl border border-surface-border bg-base px-3 py-2">
      <dt className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-copy-primary">{term}</dt>
      <dd className="text-sm text-copy-secondary">{children}</dd>
    </div>
  )
}

interface CanvasHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Reference list of every canvas shortcut and gesture. Clicking outside the
// dialog (or pressing Esc, or the close button) closes it.
export function CanvasHelpDialog({ open, onOpenChange }: CanvasHelpDialogProps) {
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Canvas shortcuts and controls"
      description="Cmd on Mac, Ctrl on Windows and Linux. Shortcuts are ignored while typing in a text field."
    >
      <div className="grid max-h-[60vh] gap-5 overflow-y-auto pr-1">
        <Section title="Keyboard">
          {KEYBOARD.map((row) => (
            <Row
              key={row.keys.join("|")}
              term={row.keys.map((combo, index) => (
                <span key={combo} className="inline-flex items-center gap-2">
                  {index > 0 && <span className="text-xs text-copy-muted">or</span>}
                  <KeyCombo combo={combo} />
                </span>
              ))}
            >
              {row.action}
            </Row>
          ))}
        </Section>

        <Section title="Mouse and touch">
          {MOUSE.map((row) => (
            <Row key={row.gesture} term={row.gesture}>
              {row.action}
            </Row>
          ))}
        </Section>

        <Section title="Built into React Flow">
          {BUILT_IN.map((row) => (
            <Row key={row.gesture} term={row.gesture}>
              {row.action}
            </Row>
          ))}
        </Section>
      </div>
    </AppDialog>
  )
}
