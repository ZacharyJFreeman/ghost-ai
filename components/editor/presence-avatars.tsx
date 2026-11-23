"use client"

import { UserButton, useUser } from "@clerk/nextjs"
import { useOthers } from "@liveblocks/react"
import { useMemo, useSyncExternalStore } from "react"

const MAX_VISIBLE_AVATARS = 5

// Same-size placeholder until mount, matching the navbar's hydration fix for
// Clerk's UserButton (it renders its container only after Clerk loads).
const subscribeNoop = () => () => {}

function CurrentUserButton() {
  const isMounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )
  if (!isMounted) return <div aria-hidden="true" className="size-7 rounded-full bg-subtle" />
  return <UserButton />
}

interface Collaborator {
  id: string
  name: string
  avatar: string
  color: string
}

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "?"
}

// Display-only avatar: the participant's picture (or initial) with a ring in
// their presence color, same 28px size as Clerk's UserButton.
function CollaboratorAvatar({ collaborator }: { collaborator: Collaborator }) {
  return (
    <span
      title={collaborator.name}
      className="flex size-7 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-subtle text-xs font-medium text-copy-primary ring-2 ring-offset-2 ring-offset-surface"
      style={{ "--tw-ring-color": collaborator.color } as React.CSSProperties}
    >
      {collaborator.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={collaborator.avatar} alt={collaborator.name} className="size-full object-cover" />
      ) : (
        initials(collaborator.name)
      )}
    </span>
  )
}

// Top-right of the canvas view: other participants as avatars, a divider when
// there are any, then the current user's Clerk UserButton. The current user is
// filtered out of the presence list by Clerk user ID (this also hides their
// own other tabs), and repeated connections of one person show once.
export function PresenceAvatars() {
  const { user } = useUser()
  const others = useOthers()

  const collaborators = useMemo(() => {
    const seen = new Map<string, Collaborator>()
    for (const other of others) {
      const id = other.id
      if (!id || id === user?.id || seen.has(id)) continue
      seen.set(id, {
        id,
        name: other.info?.name ?? "Anonymous",
        avatar: other.info?.avatar ?? "",
        color: other.info?.color ?? "var(--text-muted)",
      })
    }
    return [...seen.values()]
  }, [others, user?.id])

  const visible = collaborators.slice(0, MAX_VISIBLE_AVATARS)
  const overflow = collaborators.length - visible.length

  return (
    <div className="pointer-events-none absolute top-3 right-3 z-10">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-surface-border bg-surface px-2 py-1.5 shadow-lg">
        {collaborators.length > 0 && (
          <>
            <div className="flex items-center gap-2.5 pl-0.5">
              {visible.map((collaborator) => (
                <CollaboratorAvatar key={collaborator.id} collaborator={collaborator} />
              ))}
              {overflow > 0 && (
                <span
                  title={`${overflow} more`}
                  className="flex h-7 min-w-7 select-none items-center justify-center rounded-full bg-subtle px-1.5 text-xs font-medium text-copy-secondary"
                >
                  +{overflow}
                </span>
              )}
            </div>
            <div className="h-5 w-px bg-border" />
          </>
        )}
        <CurrentUserButton />
      </div>
    </div>
  )
}
