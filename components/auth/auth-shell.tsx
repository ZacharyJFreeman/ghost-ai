import type { ReactNode } from "react"

const FEATURES = [
  "Design system architecture on an infinite canvas",
  "Generate and refine diagrams with AI",
  "Export specs ready for implementation",
  "Collaborate with your team in real time",
]

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-base">
      <aside className="hidden w-[420px] shrink-0 flex-col justify-center gap-8 border-r border-surface-border bg-surface p-12 lg:flex">
        <div className="flex flex-col gap-2">
          <span className="text-xl font-semibold text-copy-primary">
            Ghost <span className="text-brand">AI</span>
          </span>
          <p className="text-sm text-copy-muted">
            Design software architecture with AI.
          </p>
        </div>
        <ul className="flex flex-col gap-3 text-sm text-copy-secondary">
          {FEATURES.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </aside>
      <main className="flex flex-1 items-center justify-center p-6">
        {children}
      </main>
    </div>
  )
}
