"use client"

import { Circle, Cylinder, Diamond, Hexagon, RectangleHorizontal, Square } from "lucide-react"
import { useEffect, useState, type DragEvent, type ReactNode } from "react"

import { ShapeView } from "@/components/editor/shape-view"
import { cn } from "@/lib/utils"
import {
  CANVAS_SHAPES,
  DEFAULT_NODE_COLOR,
  DEFAULT_SHAPE_SIZES,
  SHAPE_DRAG_MIME,
  type CanvasShape,
  type ShapeDragPayload,
} from "@/types/canvas"

const SHAPE_ICONS: Record<CanvasShape, typeof Square> = {
  rectangle: Square,
  diamond: Diamond,
  circle: Circle,
  pill: RectangleHorizontal,
  cylinder: Cylinder,
  hexagon: Hexagon,
}

// A 1x1 transparent image replaces the browser's drag image so the ghost
// preview is the only thing following the cursor.
let emptyDragImage: HTMLImageElement | null = null
function getEmptyDragImage() {
  if (!emptyDragImage) {
    emptyDragImage = new Image()
    emptyDragImage.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
  }
  return emptyDragImage
}

interface ShapePanelProps {
  selected: CanvasShape | null
  onSelect: (shape: CanvasShape | null) => void
  // Extra controls shown after the shapes, behind a divider.
  children?: ReactNode
}

// Floating pill toolbar at the bottom-center of the screen. Each button can be
// dragged onto the canvas (with a ghost preview), or clicked to highlight it so
// the next canvas click places the shape.
export function ShapePanel({ selected, onSelect, children }: ShapePanelProps) {
  const [dragging, setDragging] = useState<CanvasShape | null>(null)
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null)

  // Follow the cursor while a shape is being dragged. dragover fires
  // continuously with reliable coordinates in every browser.
  useEffect(() => {
    if (!dragging) return
    function track(event: globalThis.DragEvent) {
      setPointer({ x: event.clientX, y: event.clientY })
    }
    document.addEventListener("dragover", track)
    return () => document.removeEventListener("dragover", track)
  }, [dragging])

  function handleDragStart(event: DragEvent<HTMLButtonElement>, shape: CanvasShape) {
    const payload: ShapeDragPayload = { shape, ...DEFAULT_SHAPE_SIZES[shape] }
    event.dataTransfer.setData(SHAPE_DRAG_MIME, JSON.stringify(payload))
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setDragImage(getEmptyDragImage(), 0, 0)
    setPointer(null)
    setDragging(shape)
  }

  // dragend fires after a drop and after a cancelled drag.
  function handleDragEnd() {
    setDragging(null)
    setPointer(null)
  }

  return (
    <>
      <div
        data-shape-panel
        className="pointer-events-none fixed bottom-4 left-1/2 z-10 -translate-x-1/2"
      >
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-surface p-1.5 shadow-lg">
          {CANVAS_SHAPES.map((shape) => {
            const Icon = SHAPE_ICONS[shape]
            const isSelected = selected === shape
            return (
              <button
                key={shape}
                type="button"
                draggable
                title={shape}
                aria-label={`Place ${shape}`}
                aria-pressed={isSelected}
                onClick={() => onSelect(isSelected ? null : shape)}
                onDragStart={(event) => handleDragStart(event, shape)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex size-9 cursor-grab items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent-dim hover:text-foreground active:cursor-grabbing",
                  isSelected && "bg-accent-dim text-foreground",
                )}
              >
                <Icon className="size-4" />
              </button>
            )
          })}
          {children}
        </div>
      </div>

      {dragging && pointer && (
        // The center sits at the cursor, matching where the node lands on drop.
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 opacity-60"
          style={{
            left: pointer.x,
            top: pointer.y,
            width: DEFAULT_SHAPE_SIZES[dragging].width,
            height: DEFAULT_SHAPE_SIZES[dragging].height,
          }}
        >
          <ShapeView shape={dragging} color={DEFAULT_NODE_COLOR.fill} />
        </div>
      )}
    </>
  )
}
