"use client"

import { X } from "lucide-react"
import type { ReactNode } from "react"

import { pillButtonClasses } from "@/components/app/pill-button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AppDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  footer?: ReactNode
  children?: ReactNode
}

// App-level dialog shell: large rounded frame, header with a divider, padded
// body, optional footer. Wraps ui/dialog without modifying it.
export function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
}: AppDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 rounded-3xl border border-surface-border bg-surface p-0 ring-0 sm:max-w-lg"
      >
        <DialogHeader className="gap-1.5 border-b border-surface-border px-6 py-5 pr-14">
          <DialogTitle className="text-lg font-medium text-copy-primary">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-copy-muted">{description}</DialogDescription>
          )}
        </DialogHeader>
        <DialogClose
          className={`${pillButtonClasses({ variant: "ghost", size: "icon-sm" })} absolute top-4 right-4`}
        >
          <X />
          <span className="sr-only">Close</span>
        </DialogClose>

        {children && <div className="grid gap-4 p-6">{children}</div>}

        {footer && (
          <div className="flex justify-end gap-2 border-t border-surface-border px-6 py-4">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
