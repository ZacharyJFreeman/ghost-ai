"use client"

import { AppDialog } from "@/components/app/app-dialog"
import { PillButton } from "@/components/app/pill-button"
import { ShapeView } from "@/components/editor/shape-view"
import { CANVAS_TEMPLATES, type CanvasTemplate } from "@/components/editor/starter-templates"
import { DEFAULT_SHAPE_SIZES } from "@/types/canvas"

const PREVIEW_WIDTH = 280
const PREVIEW_HEIGHT = 150
const PREVIEW_PADDING = 12

// A lightweight static diagram: bounds come from the node positions, the whole
// diagram is scaled to fit a fixed viewport, edges are lines between node
// centers and nodes reuse ShapeView. No React Flow instance involved.
function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const boxes = template.nodes.map((node) => ({
    node,
    width: node.width ?? DEFAULT_SHAPE_SIZES[node.data.shape].width,
    height: node.height ?? DEFAULT_SHAPE_SIZES[node.data.shape].height,
  }))
  const minX = Math.min(...boxes.map((b) => b.node.position.x))
  const minY = Math.min(...boxes.map((b) => b.node.position.y))
  const maxX = Math.max(...boxes.map((b) => b.node.position.x + b.width))
  const maxY = Math.max(...boxes.map((b) => b.node.position.y + b.height))

  const scale = Math.min(
    (PREVIEW_WIDTH - PREVIEW_PADDING * 2) / (maxX - minX),
    (PREVIEW_HEIGHT - PREVIEW_PADDING * 2) / (maxY - minY),
  )
  const offsetX = (PREVIEW_WIDTH - (maxX - minX) * scale) / 2
  const offsetY = (PREVIEW_HEIGHT - (maxY - minY) * scale) / 2

  const place = (box: (typeof boxes)[number]) => ({
    left: offsetX + (box.node.position.x - minX) * scale,
    top: offsetY + (box.node.position.y - minY) * scale,
    width: box.width * scale,
    height: box.height * scale,
  })
  const center = (id: string) => {
    const box = boxes.find((b) => b.node.id === id)
    if (!box) return null
    const p = place(box)
    return { x: p.left + p.width / 2, y: p.top + p.height / 2 }
  }

  return (
    <div
      aria-hidden="true"
      className="relative overflow-hidden rounded-xl border border-surface-border bg-base"
      style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT, maxWidth: "100%" }}
    >
      <svg width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT} className="absolute inset-0">
        {template.edges.map((edge) => {
          const from = center(edge.source)
          const to = center(edge.target)
          if (!from || !to) return null
          return (
            <line
              key={edge.id}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="var(--text-faint)"
              strokeWidth={1.5}
            />
          )
        })}
      </svg>
      {boxes.map((box) => (
        <div key={box.node.id} className="absolute" style={place(box)}>
          <ShapeView shape={box.node.data.shape} color={box.node.data.color} />
        </div>
      ))}
    </div>
  )
}

interface StarterTemplatesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (template: CanvasTemplate) => void
}

// Dialog with a scrollable grid of starter templates. Importing hands the
// chosen template to `onImport` and closes the dialog.
export function StarterTemplatesModal({ open, onOpenChange, onImport }: StarterTemplatesModalProps) {
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Starter templates"
      description="Start from a pre-built diagram instead of a blank canvas."
    >
      <div className="max-h-[60vh] overflow-y-auto pr-1">
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
          {CANVAS_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-base p-3"
            >
              <TemplatePreview template={template} />
              <div className="grid gap-1">
                <h3 className="text-sm font-medium text-copy-primary">{template.name}</h3>
                <p className="text-xs text-copy-muted">{template.description}</p>
              </div>
              <PillButton
                size="sm"
                className="self-start"
                onClick={() => {
                  onImport(template)
                  onOpenChange(false)
                }}
              >
                Import
              </PillButton>
            </div>
          ))}
        </div>
      </div>
    </AppDialog>
  )
}
