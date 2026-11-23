"use client"

import { useOthers } from "@liveblocks/react"
import { useStore, ViewportPortal } from "@xyflow/react"
import { useUser } from "@clerk/nextjs"

// Other participants' cursors, drawn in canvas space (so they stay on the same
// spot while panning or zooming) and counter-scaled to a constant on-screen
// size. Never renders the current user, including their other tabs.
export function LiveCursors() {
  const { user } = useUser()
  const others = useOthers()
  const zoom = useStore((state) => state.transform[2])

  return (
    <ViewportPortal>
      {others.map((other) => {
        const cursor = other.presence?.cursor
        if (!cursor || other.id === user?.id) return null
        const color = other.info?.color ?? "var(--text-muted)"
        return (
          <div
            key={other.connectionId}
            className="pointer-events-none absolute top-0 left-0 z-50"
            style={{ transform: `translate(${cursor.x}px, ${cursor.y}px) scale(${1 / zoom})`, transformOrigin: "0 0" }}
          >
            <svg width="16" height="20" viewBox="0 0 16 20" fill={color} aria-hidden="true">
              <path d="M1 1 L1 16 L5 12.5 L8 19 L10.5 18 L7.5 11.5 L13 11.5 Z" stroke="var(--bg-base)" strokeWidth="1" strokeLinejoin="round" />
            </svg>
            <span
              className="absolute top-4 left-3 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap text-black"
              style={{ backgroundColor: color }}
            >
              {other.info?.name ?? "Anonymous"}
            </span>
          </div>
        )
      })}
    </ViewportPortal>
  )
}
