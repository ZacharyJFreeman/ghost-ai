"use client"

import { NodeToolbar, Position } from "@xyflow/react"

import { NODE_COLORS } from "@/types/canvas"

interface NodeColorToolbarProps {
  selected: boolean
  activeColor: string
  onSelect: (fill: string) => void
}

// Floating swatch row above a selected node. Each swatch is a fill/text pair;
// the swatch shows the fill with the text color as its ring and hover glow.
export function NodeColorToolbar({ selected, activeColor, onSelect }: NodeColorToolbarProps) {
  return (
    <NodeToolbar isVisible={selected} position={Position.Top} offset={12}>
      <div
        role="toolbar"
        aria-label="Node color"
        className="nodrag nopan flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-2 py-1.5"
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        {NODE_COLORS.map((pair) => {
          const isActive = pair.fill.toLowerCase() === activeColor.toLowerCase()
          return (
            <button
              key={pair.fill}
              type="button"
              aria-label={`Color ${pair.text}`}
              aria-pressed={isActive}
              onClick={() => onSelect(pair.fill)}
              className="size-5 cursor-pointer rounded-full border-2 transition-shadow duration-150 hover:shadow-[0_0_6px_1px_var(--swatch-glow)]"
              style={
                {
                  backgroundColor: pair.fill,
                  borderColor: isActive ? pair.text : "transparent",
                  boxShadow: isActive ? `0 0 0 2px var(--bg-surface), 0 0 0 3px ${pair.text}` : undefined,
                  "--swatch-glow": `color-mix(in srgb, ${pair.text} 70%, transparent)`,
                } as React.CSSProperties
              }
            />
          )
        })}
      </div>
    </NodeToolbar>
  )
}
