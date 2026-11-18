import { FileText, Sparkles, Users } from "lucide-react"
import type { ReactNode } from "react"

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Architecture Generation",
    description: "Describe your system, AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Users,
    title: "Real-time Collaboration",
    description: "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: FileText,
    title: "Instant Spec Generation",
    description: "Export a complete Markdown technical spec directly from the canvas graph.",
  },
]

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-base font-sans">
      <aside className="hidden w-1/2 flex-col justify-between border-r border-surface-border bg-surface p-12 lg:flex xl:px-20">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-brand" />
          <span className="text-lg font-semibold text-copy-primary">Ghost AI</span>
        </div>

        <div className="flex max-w-xl flex-col gap-10">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-copy-primary">
              Design systems at the speed of thought.
            </h1>
            <p className="text-base leading-relaxed text-copy-muted">
              Describe your architecture in plain English. Ghost AI maps it to a
              shared canvas your whole team can refine in real time.
            </p>
          </div>

          <ul className="flex flex-col gap-6">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-surface-border bg-accent-dim text-brand">
                  <Icon className="size-4" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-copy-primary">{title}</span>
                  <span className="text-sm text-copy-muted">{description}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-copy-faint">© 2026 Ghost AI. All rights reserved.</p>
      </aside>

      <main className="flex w-full items-center justify-center p-6 lg:w-1/2">
        {children}
      </main>
    </div>
  )
}
