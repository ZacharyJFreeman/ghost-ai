import { Download, FileText, Sparkles } from "lucide-react"

import { PillButton } from "@/components/app/pill-button"

// UI shell only: the button does nothing yet and the card is demo content.
export function AiSpecsTab() {
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-ai text-sm font-medium text-white transition-opacity hover:opacity-85"
      >
        <Sparkles className="size-4" />
        Generate Spec
      </button>

      <div className="flex items-start gap-3 rounded-2xl border border-surface-border bg-elevated p-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-subtle text-ai-text">
          <FileText className="size-4" />
        </span>
        <div className="grid min-w-0 flex-1 gap-1">
          <h3 className="truncate text-sm font-medium text-copy-primary">E-commerce Backend Spec</h3>
          <p className="line-clamp-2 text-xs text-copy-muted">
            Services for catalog, orders and payments behind an API gateway, with an event bus for
            order updates.
          </p>
        </div>
        <PillButton variant="ghost" size="icon-sm" aria-label="Download spec" disabled>
          <Download />
        </PillButton>
      </div>
    </div>
  )
}
