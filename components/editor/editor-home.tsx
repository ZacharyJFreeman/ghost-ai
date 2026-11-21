import { Plus } from "lucide-react"

import { PillButton } from "@/components/app/pill-button"

interface EditorHomeProps {
  onNewProject: () => void
}

export function EditorHome({ onNewProject }: EditorHomeProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-medium text-copy-primary">
        Create a project or open an existing one
      </h1>
      <p className="max-w-md text-sm text-copy-muted">
        Start a new architecture workspace, or choose a project from the sidebar.
      </p>
      <PillButton onClick={onNewProject}>
        <Plus />
        New Project
      </PillButton>
    </main>
  )
}
