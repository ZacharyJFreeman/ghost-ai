import type { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { ProjectDialogState } from "@/hooks/use-project-dialogs"

interface ProjectDialogsProps {
  dialog: ProjectDialogState
  name: string
  setName: (name: string) => void
  slug: string
  isLoading: boolean
  close: () => void
  submit: () => Promise<void>
}

function SlugError() {
  return (
    <p role="alert" className="text-xs text-error">
      Project name must include at least one letter or number.
    </p>
  )
}

export function ProjectDialogs({
  dialog,
  name,
  setName,
  slug,
  isLoading,
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
      <Dialog open={dialog.type === "create"} onOpenChange={handleOpenChange}>
        <DialogContent className="rounded-3xl">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Create project</DialogTitle>
              <DialogDescription>Give your new architecture workspace a name.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <label htmlFor="create-project-name" className="text-sm font-medium text-copy-secondary">
                Project name
              </label>
              <Input
                id="create-project-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="My architecture"
                autoComplete="off"
                aria-invalid={hasInvalidSlug}
                autoFocus
              />
              <p className="text-xs text-copy-muted">
                Slug: <span className="font-mono text-copy-secondary">{slug || "—"}</span>
              </p>
              {hasInvalidSlug && <SlugError />}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {isLoading ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.type === "rename"} onOpenChange={handleOpenChange}>
        <DialogContent className="rounded-3xl">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Rename project</DialogTitle>
              <DialogDescription>
                Enter a new name for{" "}
                <span className="font-medium text-copy-primary">
                  {dialog.type === "rename" ? dialog.project.name : ""}
                </span>
                .
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Input
                aria-label="Project name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="off"
                aria-invalid={hasInvalidSlug}
                autoFocus
              />
              {hasInvalidSlug && <SlugError />}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {isLoading ? "Saving..." : "Rename"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.type === "delete"} onOpenChange={handleOpenChange}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Delete project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-copy-primary">
                {dialog.type === "delete" ? dialog.project.name : ""}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void submit()}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
