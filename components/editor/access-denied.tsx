import { Lock } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

export function AccessDenied() {
  return (
    <main className="flex h-screen flex-col items-center justify-center gap-4 bg-base px-4 text-center">
      <Lock className="h-8 w-8 text-copy-faint" aria-hidden="true" />
      <h1 className="text-2xl font-medium text-copy-primary">Access denied</h1>
      <p className="max-w-md text-sm text-copy-muted">
        This project doesn&apos;t exist, or you don&apos;t have access to it.
      </p>
      <Link href="/editor" className={buttonVariants({ variant: "outline" })}>
        Back to editor
      </Link>
    </main>
  )
}
