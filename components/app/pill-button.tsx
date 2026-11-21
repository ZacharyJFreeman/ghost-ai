import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

type PillVariant = "primary" | "dark" | "danger" | "ghost"
type PillSize = "default" | "sm" | "icon" | "icon-sm"

interface PillButtonStyle {
  variant?: PillVariant
  size?: PillSize
}

const VARIANT_CLASSES: Record<PillVariant, string> = {
  primary: "bg-brand text-primary-foreground hover:bg-brand/80",
  dark: "border-surface-border bg-base text-copy-primary hover:bg-subtle",
  danger: "bg-error/10 text-error hover:bg-error/20",
  ghost: "text-copy-secondary hover:bg-subtle hover:text-copy-primary",
}

const SIZE_CLASSES: Record<PillSize, string> = {
  default: "h-9 px-4 text-sm",
  sm: "h-8 px-3 text-xs",
  icon: "size-8",
  "icon-sm": "size-7",
}

// Class helper so non-button elements (e.g. next/link) can share the pill look.
export function pillButtonClasses({ variant = "primary", size = "default" }: PillButtonStyle = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-transparent font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size]
  )
}

export function PillButton({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & PillButtonStyle) {
  return <button type={type} className={cn(pillButtonClasses({ variant, size }), className)} {...props} />
}
