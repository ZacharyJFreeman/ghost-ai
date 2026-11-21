import type { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"

interface PanelProps extends Omit<ComponentProps<"section">, "title"> {
  title?: string
  description?: string
  action?: ReactNode
}

// Bordered, rounded section used to group content inside dialogs and screens.
export function Panel({ title, description, action, className, children, ...props }: PanelProps) {
  const hasHeader = Boolean(title || description || action)

  return (
    <section
      className={cn("rounded-2xl border border-surface-border bg-base p-4", className)}
      {...props}
    >
      {hasHeader && (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-medium text-copy-primary">{title}</h3>}
            {description && <p className="mt-1 text-xs text-copy-muted">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children && <div className={cn(hasHeader && "mt-3")}>{children}</div>}
    </section>
  )
}
