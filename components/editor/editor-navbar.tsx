"use client"

import { UserButton } from "@clerk/nextjs"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"

interface EditorNavbarProps {
  isOpen: boolean
  onToggle?: () => void
  title?: string
  actions?: ReactNode
}

export function EditorNavbar({ isOpen, onToggle, title, actions }: EditorNavbarProps) {
  const Icon = isOpen ? PanelLeftClose : PanelLeftOpen

  return (
    <nav className="flex h-12 shrink-0 items-center justify-between border-b border-surface-border bg-surface px-3">
      <div className="flex flex-1 items-center">
        <Button
          variant="ghost"
          size="icon"
          aria-label={isOpen ? "Close projects sidebar" : "Open projects sidebar"}
          onClick={onToggle}
        >
          <Icon className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-center">
        {title && <h1 className="truncate text-sm font-medium text-copy-primary">{title}</h1>}
      </div>
      <div className="flex flex-1 items-center justify-end gap-2">
        {actions}
        <UserButton />
      </div>
    </nav>
  )
}
