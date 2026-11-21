import { Lock } from "lucide-react"
import Link from "next/link"

import { Panel } from "@/components/app/panel"
import { pillButtonClasses } from "@/components/app/pill-button"

export function AccessDenied() {
  return (
    <main className="flex h-screen items-center justify-center bg-base px-4">
      <Panel className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl bg-surface p-8 text-center">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-surface-border bg-accent-dim text-brand">
          <Lock className="size-5" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-medium text-copy-primary">Access denied</h1>
        <p className="text-sm text-copy-muted">
          This project doesn&apos;t exist, or you don&apos;t have access to it.
        </p>
        <Link href="/editor" className={pillButtonClasses({ variant: "dark" })}>
          Back to editor
        </Link>
      </Panel>
    </main>
  )
}
