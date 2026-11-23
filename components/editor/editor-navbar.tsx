"use client"

import { UserButton } from "@clerk/nextjs"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { useSyncExternalStore, type ReactNode } from "react"

import { PillButton } from "@/components/app/pill-button"

interface EditorNavbarProps {
  isOpen: boolean
  onToggle?: () => void
  title?: string
  actions?: ReactNode
  // The workspace view shows the Clerk UserButton inside the canvas presence group instead.
  showUserMenu?: boolean
}

// Clerk renders the UserButton container only once its script has loaded, which
// can happen before hydration, so the server HTML and first client render differ.
// Render it after mount (server and hydration snapshot: false) with a same-size
// placeholder so the markup always matches and the navbar does not shift.
const subscribeNoop = () => () => {}

function UserMenu() {
  const isMounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  )

  if (!isMounted) {
    return <div aria-hidden="true" className="size-7 rounded-full bg-subtle" />
  }
  return <UserButton />
}

export function EditorNavbar({
  isOpen,
  onToggle,
  title,
  actions,
  showUserMenu = true,
}: EditorNavbarProps) {
  const Icon = isOpen ? PanelLeftClose : PanelLeftOpen

  return (
    <nav className="flex h-12 shrink-0 items-center justify-between border-b border-surface-border bg-surface px-3">
      <div className="flex flex-1 items-center">
        <PillButton
          variant="ghost"
          size="icon"
          aria-label={isOpen ? "Close projects sidebar" : "Open projects sidebar"}
          onClick={onToggle}
        >
          <Icon className="size-5" />
        </PillButton>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-center">
        {title && <h1 className="truncate text-sm font-medium text-copy-primary">{title}</h1>}
      </div>
      <div className="flex flex-1 items-center justify-end gap-2">
        {actions}
        {showUserMenu && <UserMenu />}
      </div>
    </nav>
  )
}
