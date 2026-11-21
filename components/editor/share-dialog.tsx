import { Check, Link2, Mail, Trash2 } from "lucide-react"
import type { FormEvent } from "react"

import { AppDialog } from "@/components/app/app-dialog"
import { Badge } from "@/components/app/badge"
import { Panel } from "@/components/app/panel"
import { PillButton } from "@/components/app/pill-button"
import { PillInput } from "@/components/app/pill-input"
import type { useShareDialog } from "@/hooks/use-share-dialog"

type ShareState = ReturnType<typeof useShareDialog>

interface ShareDialogProps {
  share: ShareState
  isOwner: boolean
}

interface PersonRowProps {
  name: string | null
  email: string | null
  imageUrl: string | null
  badge: "owner" | "collaborator"
  onRemove?: () => void
  isRemoving?: boolean
}

function Avatar({ name, email, imageUrl }: Pick<PersonRowProps, "name" | "email" | "imageUrl">) {
  const initial = (name ?? email ?? "?").charAt(0).toUpperCase()

  if (imageUrl) {
    return (
      // Clerk-hosted avatar; a plain img avoids per-host next/image config.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt="" className="size-10 shrink-0 rounded-full object-cover" />
    )
  }

  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-subtle text-sm font-medium text-copy-secondary"
    >
      {initial}
    </span>
  )
}

function PersonRow({ name, email, imageUrl, badge, onRemove, isRemoving }: PersonRowProps) {
  const title = name ?? email ?? "Owner"

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-surface-border bg-base px-4 py-3">
      <Avatar name={name} email={email} imageUrl={imageUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-copy-primary">{title}</span>
          <Badge tone={badge === "owner" ? "brand" : "muted"} className="shrink-0">
            {badge}
          </Badge>
        </div>
        {email && <p className="truncate text-xs text-copy-muted">{email}</p>}
      </div>
      {onRemove && (
        <PillButton
          variant="danger"
          size="icon"
          aria-label={`Remove ${email ?? "collaborator"}`}
          disabled={isRemoving}
          onClick={onRemove}
        >
          <Trash2 />
        </PillButton>
      )}
    </li>
  )
}

export function ShareDialog({ share, isOwner }: ShareDialogProps) {
  const {
    isOpen,
    owner,
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

  // The owner always has access, so they count toward the total.
  const total = collaborators.length + 1

  return (
    <AppDialog
      open={isOpen}
      onOpenChange={(open) => !open && close()}
      title="Share project"
      description={
        isOwner
          ? "Invite collaborators, copy the workspace link, and manage access."
          : "People with access to this project. Only the owner can manage access."
      }
    >
      {isOwner && (
        <>
          <Panel
            title="Workspace link"
            description="Share a direct link with teammates after you grant them access."
            action={
              <PillButton variant="dark" onClick={() => void copyLink()}>
                {copied ? <Check /> : <Link2 />}
                {copied ? "Copied!" : "Copy link"}
              </PillButton>
            }
          />

          <Panel>
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <PillInput
                type="email"
                aria-label="Collaborator email"
                placeholder="teammate@company.com"
                icon={<Mail />}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="off"
                disabled={isInviting}
              />
              <PillButton type="submit" disabled={isInviting || !email.trim()}>
                {isInviting ? "Inviting..." : "Invite"}
              </PillButton>
            </form>
          </Panel>
        </>
      )}

      {error && (
        <p role="alert" className="text-xs text-error">
          {error}
        </p>
      )}

      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-copy-primary">People with access</h3>
          {!isLoading && owner && <span className="text-xs text-copy-faint">{total} total</span>}
        </div>

        {isLoading || !owner ? (
          <p className="text-sm text-copy-muted">{error ? "Couldn't load people." : "Loading..."}</p>
        ) : (
          <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            <PersonRow
              name={owner.name}
              email={owner.email}
              imageUrl={owner.imageUrl}
              badge="owner"
            />
            {collaborators.map((collaborator) => (
              <PersonRow
                key={collaborator.id}
                name={collaborator.name ?? collaborator.email}
                email={collaborator.email}
                imageUrl={collaborator.imageUrl}
                badge="collaborator"
                onRemove={isOwner ? () => void remove(collaborator.id) : undefined}
                isRemoving={removingId === collaborator.id}
              />
            ))}
          </ul>
        )}
      </section>
    </AppDialog>
  )
}
