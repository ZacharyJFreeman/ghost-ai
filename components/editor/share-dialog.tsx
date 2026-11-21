import { Check, Link2, X } from "lucide-react"
import type { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { useShareDialog } from "@/hooks/use-share-dialog"
import type { Collaborator } from "@/lib/collaborators"

type ShareState = ReturnType<typeof useShareDialog>

interface ShareDialogProps {
  share: ShareState
  isOwner: boolean
}

function CollaboratorAvatar({ collaborator }: { collaborator: Collaborator }) {
  const initial = (collaborator.name ?? collaborator.email).charAt(0).toUpperCase()

  if (collaborator.imageUrl) {
    return (
      // Clerk-hosted avatar; a plain img avoids per-host next/image config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={collaborator.imageUrl}
        alt=""
        className="h-8 w-8 shrink-0 rounded-full object-cover"
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-subtle text-xs font-medium text-copy-secondary"
    >
      {initial}
    </span>
  )
}

export function ShareDialog({ share, isOwner }: ShareDialogProps) {
  const {
    isOpen,
    collaborators,
    isLoading,
    isInviting,
    removingId,
    email,
    setEmail,
    error,
    copied,
    close,
    invite,
    remove,
    copyLink,
  } = share

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void invite()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Share project</DialogTitle>
          <DialogDescription>
            {isOwner
              ? "Invite people by email to collaborate on this project."
              : "People with access to this project. Only the owner can manage access."}
          </DialogDescription>
        </DialogHeader>

        {isOwner && (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="email"
              aria-label="Collaborator email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="off"
              disabled={isInviting}
            />
            <Button type="submit" disabled={isInviting || !email.trim()}>
              {isInviting ? "Inviting..." : "Invite"}
            </Button>
          </form>
        )}

        {error && (
          <p role="alert" className="text-xs text-error">
            {error}
          </p>
        )}

        <div className="grid gap-2">
          <h3 className="text-sm font-medium text-copy-secondary">Collaborators</h3>
          {isLoading ? (
            <p className="text-sm text-copy-muted">Loading...</p>
          ) : collaborators.length === 0 ? (
            <p className="text-sm text-copy-muted">No collaborators yet.</p>
          ) : (
            <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
              {collaborators.map((collaborator) => (
                <li
                  key={collaborator.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-1.5"
                >
                  <CollaboratorAvatar collaborator={collaborator} />
                  <span className="min-w-0 flex-1">
                    {collaborator.name && (
                      <span className="block truncate text-sm text-copy-primary">
                        {collaborator.name}
                      </span>
                    )}
                    <span
                      className={
                        collaborator.name
                          ? "block truncate text-xs text-copy-muted"
                          : "block truncate text-sm text-copy-primary"
                      }
                    >
                      {collaborator.email}
                    </span>
                  </span>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Remove ${collaborator.email}`}
                      disabled={removingId === collaborator.id}
                      onClick={() => void remove(collaborator.id)}
                    >
                      <X />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {isOwner && (
          <Button variant="outline" onClick={() => void copyLink()}>
            {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy link"}
            </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
