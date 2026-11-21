import type { FormEvent } from "react"

import { AppDialog } from "@/components/app/app-dialog"
import { Panel } from "@/components/app/panel"
import { PillButton } from "@/components/app/pill-button"
import { PillInput } from "@/components/app/pill-input"
import type { ProjectDialogState } from "@/hooks/use-project-actions"

interface ProjectDialogsProps {
  dialog: ProjectDialogState
  name: string
  setName: (name: string) => void
  slug: string
  roomId: string
  isLoading: boolean
  error: string | null
  close: () => void
  submit: () => Promise<void>
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p role="alert" className="text-xs text-error">
      {message}
    </p>
  )
}

function SlugError() {
  return <ErrorMessage message="Project name must include at least one letter or number." />
}

export function ProjectDialogs({
  dialog,
  name,
  setName,
  slug,
  roomId,
  isLoading,
  error,
  close,
  submit,
}: ProjectDialogsProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) close()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submit()
  }

  const hasInvalidSlug = name.trim().length > 0 && slug.length === 0
  const canSubmit = slug.length > 0 && !isLoading

  return (
    <>
      <AppDialog
        open={dialog.type === "create"}
        onOpenChange={handleOpenChange}
        title="Create project"
        description="Give your new architecture workspace a name."
        footer={
          <>
            <PillButton variant="dark" onClick={close} disabled={isLoading}>
              Cancel
            </PillButton>
            <PillButton type="submit" form="create-project-form" disabled={!canSubmit}>
              {isLoading ? "Creating..." : "Create"}
            </PillButton>
          </>
        }
      >
        <form id="create-project-form" onSubmit={handleSubmit} className="grid gap-3">
          <label htmlFor="create-project-name" className="text-sm font-medium text-copy-secondary">
            Project name
          </label>
          <PillInput
            id="create-project-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="My architecture"
            autoComplete="off"
            aria-invalid={hasInvalidSlug}
            autoFocus
          />
          <Panel className="px-4 py-3">
            <p className="text-xs text-copy-muted">
              Room ID: <span className="font-mono text-copy-secondary">{roomId || "—"}</span>
            </p>
          </Panel>
          {hasInvalidSlug && <SlugError />}
          {error && <ErrorMessage message={error} />}
        </form>
      </AppDialog>

      <AppDialog
        open={dialog.type === "rename"}
        onOpenChange={handleOpenChange}
        title="Rename project"
        description={
          <>
            Enter a new name for{" "}
            <span className="font-medium text-copy-primary">
              {dialog.type === "rename" ? dialog.project.name : ""}
            </span>
            .
          </>
        }
        footer={
          <>
            <PillButton variant="dark" onClick={close} disabled={isLoading}>
              Cancel
            </PillButton>
            <PillButton type="submit" form="rename-project-form" disabled={!canSubmit}>
              {isLoading ? "Saving..." : "Rename"}
            </PillButton>
          </>
        }
      >
        <form id="rename-project-form" onSubmit={handleSubmit} className="grid gap-3">
          <PillInput
            aria-label="Project name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
            aria-invalid={hasInvalidSlug}
            autoFocus
          />
          {hasInvalidSlug && <SlugError />}
          {error && <ErrorMessage message={error} />}
        </form>
      </AppDialog>

      <AppDialog
        open={dialog.type === "delete"}
        onOpenChange={handleOpenChange}
        title="Delete project"
        description={
          <>
            Are you sure you want to delete{" "}
            <span className="font-medium text-copy-primary">
              {dialog.type === "delete" ? dialog.project.name : ""}
            </span>
            ? This action cannot be undone.
          </>
        }
        footer={
          <>
            <PillButton variant="dark" onClick={close} disabled={isLoading}>
              Cancel
            </PillButton>
            <PillButton variant="danger" onClick={() => void submit()} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete"}
            </PillButton>
          </>
        }
      >
        {error && <ErrorMessage message={error} />}
      </AppDialog>
    </>
  )
}
