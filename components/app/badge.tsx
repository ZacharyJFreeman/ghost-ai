import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

type BadgeTone = "brand" | "muted"

const TONE_CLASSES: Record<BadgeTone, string> = {
  brand: "border-brand/30 bg-accent-dim text-brand",
  muted: "border-surface-border text-copy-faint",
}

export function Badge({
  tone = "muted",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-medium tracking-wider uppercase",
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    />
  )
}
