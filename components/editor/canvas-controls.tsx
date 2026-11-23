"use client"

import { Info, Maximize, Redo2, Undo2, ZoomIn, ZoomOut } from "lucide-react"
import { useState } from "react"

import { CanvasHelpDialog } from "@/components/editor/canvas-help-dialog"
import { cn } from "@/lib/utils"

interface CanvasControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

function ControlButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors",
        disabled
          ? "cursor-not-allowed opacity-35"
          : "cursor-pointer hover:bg-accent-dim hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

// Rendered inside the shape panel pill, after the shapes: a divider, zoom controls,
// another divider, undo/redo, another divider, then the shortcuts info button.
export function CanvasControls(props: CanvasControlsProps) {
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <>
      <div className="mx-1 h-5 w-px bg-border" />
        <ControlButton label="Zoom out" onClick={props.onZoomOut}>
          <ZoomOut className="size-4" />
        </ControlButton>
        <ControlButton label="Fit view" onClick={props.onFitView}>
          <Maximize className="size-4" />
        </ControlButton>
        <ControlButton label="Zoom in" onClick={props.onZoomIn}>
          <ZoomIn className="size-4" />
        </ControlButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ControlButton label="Undo" onClick={props.onUndo} disabled={!props.canUndo}>
          <Undo2 className="size-4" />
        </ControlButton>
        <ControlButton label="Redo" onClick={props.onRedo} disabled={!props.canRedo}>
          <Redo2 className="size-4" />
        </ControlButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ControlButton label="Shortcuts and controls" onClick={() => setHelpOpen(true)}>
          <Info className="size-4" />
        </ControlButton>
        {/* The dialog renders in a portal, but React events still bubble to the
            canvas wrapper, whose click handler places an armed shape. Stop them
            here so clicking in or outside the dialog never places a shape. */}
        <span className="contents" onClick={(event) => event.stopPropagation()}>
          <CanvasHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
        </span>
    </>
  )
}
