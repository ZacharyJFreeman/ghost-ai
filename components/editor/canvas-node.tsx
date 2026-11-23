"use client"

import { Handle, NodeResizer, Position, useReactFlow, useStore, type NodeProps } from "@xyflow/react"
import { useEffect, useRef, useState } from "react"

import { NodeColorToolbar } from "@/components/editor/node-color-toolbar"
import { ShapeView } from "@/components/editor/shape-view"
import { onNodeEditRequest } from "@/lib/canvas-edit-request"
import { NODE_COLORS, type CanvasNode } from "@/types/canvas"

const MIN_NODE_WIDTH = 60
const MIN_NODE_HEIGHT = 40
const LABEL_PLACEHOLDER = "Label"

// Renders the node's shape from the synced node data, with side handles, resize
// handles when selected, and an inline label editor. Every change goes through
// React Flow's node updates, which the Liveblocks hook syncs to the room.
export function CanvasNodeView({ id, data, selected }: NodeProps<CanvasNode>) {
  const { updateNodeData } = useReactFlow<CanvasNode>()
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // The color toolbar and resize handles belong to a single selected shape. The
  // selector returns a boolean, so a node re-renders only when this flips.
  const inMultiSelection = useStore(
    (state) => state.nodes.reduce((count, node) => count + (node.selected ? 1 : 0), 0) > 1,
  )
  const showControls = selected && !inMultiSelection

  const text = NODE_COLORS.find((pair) => pair.fill === data.color)?.text ?? NODE_COLORS[0].text

  // The Enter shortcut asks the one selected node to start editing its label.
  useEffect(() => onNodeEditRequest(id, () => setIsEditing(true)), [id])

  useEffect(() => {
    if (!isEditing) return
    const textarea = textareaRef.current
    textarea?.focus()
    textarea?.setSelectionRange(textarea.value.length, textarea.value.length)
  }, [isEditing])

  // The mirror text sizes the label box, so the textarea overlay never shifts the layout.
  const mirror = (isEditing ? data.label : data.label || LABEL_PLACEHOLDER) + "​"

  return (
    <div className="size-full">
      <NodeResizer
        isVisible={showControls}
        minWidth={MIN_NODE_WIDTH}
        minHeight={MIN_NODE_HEIGHT}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: 2,
          backgroundColor: text,
          border: "none",
        }}
        lineStyle={{ borderColor: `color-mix(in srgb, ${text} 45%, transparent)` }}
      />
      <NodeColorToolbar
        selected={showControls}
        activeColor={data.color}
        onSelect={(fill) => updateNodeData(id, { color: fill })}
      />
      <ShapeView shape={data.shape} color={data.color} selected={selected} />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-3">
        <div
          className="nopan pointer-events-auto relative min-w-12 max-w-full cursor-text text-center text-sm"
          style={{ color: text }}
          onDoubleClick={() => setIsEditing(true)}
        >
          <span
            className={`block whitespace-pre-wrap break-words ${
              isEditing ? "invisible" : data.label ? "" : "opacity-40"
            }`}
          >
            {mirror}
          </span>
          {isEditing && (
            <textarea
              ref={textareaRef}
              value={data.label}
              rows={1}
              placeholder={LABEL_PLACEHOLDER}
              onChange={(event) => updateNodeData(id, { label: event.target.value })}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(event) => {
                event.stopPropagation()
                if (event.key === "Escape") setIsEditing(false)
              }}
              className="nodrag nopan nowheel absolute inset-0 size-full resize-none overflow-hidden border-0 bg-transparent p-0 text-center text-sm leading-[inherit] outline-none placeholder:opacity-40"
              style={{ color: text }}
            />
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Left} id="left" />
    </div>
  )
}
