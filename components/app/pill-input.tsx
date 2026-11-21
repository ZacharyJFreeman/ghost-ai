import type { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"

interface PillInputProps extends ComponentProps<"input"> {
  icon?: ReactNode
}

export function PillInput({ icon, className, ...props }: PillInputProps) {
  return (
    <div className="relative w-full">
      {icon && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-copy-faint [&_svg]:size-4"
        >
          {icon}
        </span>
      )}
      <input
        className={cn(
          "h-10 w-full min-w-0 rounded-full border border-surface-border bg-base px-4 text-sm text-copy-primary transition-colors outline-none placeholder:text-copy-faint focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-error aria-invalid:ring-3 aria-invalid:ring-error/20",
          icon && "pl-10",
          className
        )}
        {...props}
      />
    </div>
  )
}
