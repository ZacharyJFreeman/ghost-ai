"use client"

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react"
import { useEffect, useRef } from "react"

import { clearPendingEdit, hasPendingEdit } from "@/lib/canvas-edit-request"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

const LABEL_PLACEHOLDER = "Label"
const MIN_LABEL_CHARS = 5

// Replaces React Flow's default edge, so every line (drawn, saved, template) goes
// through it. The path is the same bezier as the built-in default edge. When the
// edge has a text label (`data.label`), an editable text box sits over the middle
// of the line. It is part of the line, not a shape: it cannot be moved and is
// removed when its text is cleared. The text is saved in the edge data, so it
// syncs and autosaves like any other edge field.
export function CanvasEdgeView({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  interactionWidth,
  data,
}: EdgeProps<CanvasEdge>) {
  const { updateEdgeData } = useReactFlow<CanvasNode, CanvasEdge>()
  const inputRef = useRef<HTMLInputElement>(null)

  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const label = typeof data?.label === "string" ? data.label : null

  // A line that was just given a label opens its text box for typing. The request
  // is local and one-shot (see lib/canvas-edit-request.ts).
  const hasLabel = label !== null
  useEffect(() => {
    if (!hasLabel || !hasPendingEdit(id)) return
    clearPendingEdit(id)
    inputRef.current?.focus()
  }, [hasLabel, id])

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={style}
        interactionWidth={interactionWidth}
      />
      {label !== null && (
        <EdgeLabelRenderer>
          {/* Clicks and double-clicks here must not reach the line's own handlers
              (a double-click on the line deletes it). */}
          <div
            className="nodrag nopan"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={(event) => event.stopPropagation()}
          >
            <input
              ref={inputRef}
              value={label}
              placeholder={LABEL_PLACEHOLDER}
              aria-label="Line label"
              style={{ width: `${Math.max(label.length, MIN_LABEL_CHARS) + 3}ch` }}
              onChange={(event) => updateEdgeData(id, { label: event.target.value })}
              // An empty label is removed, so the line goes back to a plain line.
              onBlur={() => {
                if (label.trim() === "") updateEdgeData(id, {}, { replace: true })
              }}
              onKeyDown={(event) => {
                event.stopPropagation()
                if (event.key === "Enter" || event.key === "Escape") event.currentTarget.blur()
              }}
              className="rounded-full border border-border bg-surface px-3 py-1 text-center text-xs text-foreground shadow-lg outline-none placeholder:text-muted-foreground focus:border-brand/60"
            />
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
