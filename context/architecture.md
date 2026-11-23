# Architecture Context

## Stack

| Layer     | Technology               | Role                                                            |
| --------- | ------------------------ | --------------------------------------------------------------- |
| Framework | Next.js 16 + TypeScript  | Full-stack app with server/client boundaries                    |
| UI        | Tailwind + shadcn/ui     | Component composition and styling                               |
| Auth      | Clerk                    | User identity and route protection                              |
| Database  | Prisma + PostgreSQL      | Relational metadata: projects, collaborators, specs, task runs  |
| Canvas    | Liveblocks + React Flow  | Real-time collaborative canvas, presence, and cursors            |
| Background tasks | Trigger.dev       | Durable AI generation workflows                                 |
| Artifact storage | Vercel Blob       | Canvas snapshots and generated Markdown specs                   |
| [Layer]   | [Technology]             | [Role]                                                          |

## System Boundaries

- `app/api` — Authenticated request handlers: input validation, ownership checks, task triggering, and persistence.
- `trigger` — Long-running background jobs: AI design generation and spec generation.
- `lib` — Shared infrastructure: Prisma client, access control helpers, and utilities.
- `lib/client` — Client-side API wrappers (`fetch` calls to `app/api`) used by hooks. Client-safe only: no server imports (Prisma, Clerk server SDK).
- `types` — Shared TypeScript types and constants (e.g. `types/canvas.ts`: canvas node/edge types and the node color palette).
- `liveblocks.config.ts` (project root) — Global Liveblocks `Presence` and `UserMeta` types.
- `components` — UI composition: canvas surfaces, sidebars, dialogs, and interactive elements.
- `hooks` — Client-side React hooks that own UI state (e.g. project dialog, form, and loading state). No data access or business rules.
- `prisma` — Database schema and generated client output.
- `data` — Legacy local directory. Not used for new artifacts.

## Storage Model

- **Database**: metadata, ownership, relationships, and task run records.
- **Vercel Blob**: generated artifacts — canvas snapshots at `canvas/{projectId}.json` and specs at `specs/{projectId}/{specId}.md`.
- Project records, spec records, and task run records belong in PostgreSQL.
- Canvas content and Markdown output are stored in and retrieved from Vercel Blob.
- The blob URL is stored in the database (`canvasJsonPath`, `filePath`) as the reference to the artifact.

## Auth and Collaboration Model

- Every project has a single owner (Clerk user ID).
- Projects can include additional collaborators.
- Only authenticated users can access protected routes.
- Route protection is resource-based, not path-based: `proxy.ts` only runs `clerkMiddleware()` so `auth()` works. Every page and route handler that needs a signed-in user checks auth itself — pages redirect to `/sign-in`, API routes return `401`. A new page or route that needs auth must add its own check.
- Only the owner or a collaborator can mutate project resources. Rename, delete, invite, and remove are owner-only; collaborators can view the project and the collaborator list.
- Collaborators are stored by email in `ProjectCollaborator` and matched to the signed-in user's primary Clerk email, case-insensitively. There is no local user table; display name and avatar come from the Clerk Backend API and fall back to the email when no Clerk user exists.
- Workspace access (`/editor/[roomId]`) is checked server-side. Missing and unauthorized projects are indistinguishable and both show `AccessDenied`.
- The project ID is also the Liveblocks room ID. It is the slugified project name plus a short unique suffix, generated on the client and validated and uniqueness-checked by `POST /api/projects` (the schema's `cuid()` default applies when no ID is sent).
- Liveblocks room tokens are issued only after verifying project membership.

## Starter System Designs

- Prebuilt templates are static canvas snapshots stored in the codebase.
- Templates are loaded into the active Liveblocks room when a user imports one.
- Import can occur on canvas creation or from within the editor at any time.

## Canvas Schema Notes

- Node data is `{ label, color, shape }`. Edges have no `type` and carry only an optional `data.label` (the text box over a line, saved and synced with the edge). Arrowheads come from React Flow `defaultEdgeOptions` at render time and are not stored.
- Selection, dragging, measured size, pan mode, the clipboard, and edit requests are local to each browser and are never synced or saved.

## Invariants

1. Request handlers do not run long-lived AI work — that belongs in background tasks.
2. Metadata and large generated artifacts are stored in separate layers.
3. Auth and ownership are enforced at every mutation boundary.
4. Client components are used only where browser interactivity or real-time state requires them.
5. The canvas schema must remain consistent between user-created content and imported templates.
