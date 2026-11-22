"use client"

import { Circle, Cylinder, Diamond, Hexagon, RectangleHorizontal, Square } from "lucide-react"
import type { DragEvent } from "react"

import { cn } from "@/lib/utils"
import {
  CANVAS_SHAPES,
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

function handleDragStart(event: DragEvent<HTMLButtonElement>, shape: CanvasShape) {
  const payload: ShapeDragPayload = { shape, ...DEFAULT_SHAPE_SIZES[shape] }
  event.dataTransfer.setData(SHAPE_DRAG_MIME, JSON.stringify(payload))
  event.dataTransfer.effectAllowed = "move"
}

interface ShapePanelProps {
  selected: CanvasShape | null
  onSelect: (shape: CanvasShape | null) => void
}

// Floating pill toolbar at the bottom-center of the canvas. Each button can be
// dragged onto the canvas, or clicked to highlight it so the next canvas click
// places the shape.
export function ShapePanel({ selected, onSelect }: ShapePanelProps) {
  return (
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
              className={cn(
                "flex size-9 cursor-grab items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent-dim hover:text-foreground active:cursor-grabbing",
                isSelected && "bg-accent-dim text-foreground",
              )}
            >
              <Icon className="size-4" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
