"use client"

import { Circle, Cylinder, Diamond, Hexagon, RectangleHorizontal, Square } from "lucide-react"
import type { DragEvent } from "react"

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

// Floating pill toolbar at the bottom-center of the canvas. Each button drags
// a shape onto the canvas.
export function ShapePanel() {
  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-surface p-1.5 shadow-lg">
        {CANVAS_SHAPES.map((shape) => {
          const Icon = SHAPE_ICONS[shape]
          return (
            <button
              key={shape}
              type="button"
              draggable
              title={shape}
              aria-label={`Drag ${shape}`}
              onDragStart={(event) => handleDragStart(event, shape)}
              className="flex size-9 cursor-grab items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent-dim hover:text-foreground active:cursor-grabbing"
            >
              <Icon className="size-4" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
