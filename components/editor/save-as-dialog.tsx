import type { FormEvent } from "react"

import { AppDialog } from "@/components/app/app-dialog"
import { Panel } from "@/components/app/panel"
import { PillButton } from "@/components/app/pill-button"
import { PillInput } from "@/components/app/pill-input"
import type { useSaveAs } from "@/hooks/use-save-as"

interface SaveAsDialogProps {
  saveAs: ReturnType<typeof useSaveAs>
}

// Names a new project that starts as a copy of the current canvas.
export function SaveAsDialog({ saveAs }: SaveAsDialogProps) {
  const { isOpen, name, setName, slug, roomId, isLoading, error, close, submit } = saveAs

  const hasInvalidSlug = name.trim().length > 0 && slug.length === 0
  const canSubmit = slug.length > 0 && !isLoading

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submit()
  }

  return (
    <AppDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close()
      }}
      title="Save as"
      description="Create a new project that starts as a copy of this canvas. The original stays as it is."
      footer={
        <>
          <PillButton variant="dark" onClick={close} disabled={isLoading}>
            Cancel
          </PillButton>
          <PillButton type="submit" form="save-as-form" disabled={!canSubmit}>
            {isLoading ? "Copying..." : "Save as"}
          </PillButton>
        </>
      }
    >
      <form id="save-as-form" onSubmit={handleSubmit} className="grid gap-3">
        <label htmlFor="save-as-name" className="text-sm font-medium text-copy-secondary">
          New project name
        </label>
        <PillInput
          id="save-as-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="My architecture copy"
          autoComplete="off"
          aria-invalid={hasInvalidSlug}
          autoFocus
        />
        <Panel className="px-4 py-3">
          <p className="text-xs text-copy-muted">
            Room ID: <span className="font-mono text-copy-secondary">{roomId || "—"}</span>
          </p>
        </Panel>
        {hasInvalidSlug && (
          <p role="alert" className="text-xs text-error">
            Project name must include at least one letter or number.
          </p>
        )}
        {error && (
          <p role="alert" className="text-xs text-error">
            {error}
          </p>
        )}
      </form>
    </AppDialog>
  )
}
