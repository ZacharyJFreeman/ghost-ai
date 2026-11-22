# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundation

## Current Goal

- 12 Shape Panel — implemented (not committed); needs signed-in browser verification. 11 Base Canvas is implemented and pushed; waiting on signed-in browser verification (see Next Up).

## Status Key

- **Implemented**: code done; `tsc`, `npm run lint`, and `npm run build` pass.
- **Pushed**: on `origin/development`. `main` has everything through the app-wide restyle (merged via PR #2); specs 10 and 11 are not on `main` yet.
- **Verified**: checked signed in, in a browser. **Nothing is verified at this level yet.** The checks that have run are listed under Verification Log.

## Completed

Every unit below is implemented and pushed to `development`; none is browser-verified.

- **01 Design System**: shadcn/ui (base-nova style, Base UI primitives) with Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea in `components/ui/`; `lucide-react`; `cn()` in `lib/utils.ts`; dark-only tokens in `app/globals.css` with the shadcn variables mapped onto them. The only change to `components/ui/*` is the `cn` import rewrite (see Architecture Decisions).
- **02 Editor**: `project-sidebar.tsx` (floating left sidebar, `isOpen`/`onClose`, My Projects/Shared tabs, `New Project` button) and `editor-navbar.tsx` (added from the user's screenshot). The dialog pattern is covered by `components/ui/dialog.tsx`.
- **03 Auth**: `ClerkProvider` (dark theme, variables mapped to CSS vars) in the root layout; `(auth)` sign-in/sign-up pages with a 50/50 `AuthShell`; `/` redirects by auth state; `UserButton` in the navbar. Route protection is now resource-based (see below). Spec 03 has a "Later Changes" section for the deviations. The sign-out redirect fix (`NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL=/sign-in`) is not yet confirmed with a live sign-out.
- **04 Project Dialogs**: editor home, create/rename/delete dialogs, owner-only sidebar actions, mobile scrim, empty-slug validation. Originally mock-only; now backed by the real API (see 07). Its `use-project-dialogs.ts` hook no longer exists.
- **05 Prisma**: `Project` (owner = Clerk ID, name, optional description, `DRAFT`/`ARCHIVED` status, `canvasJsonPath`, timestamps, indexes) and `ProjectCollaborator` (cascade delete, email, unique project/email, indexes) in `prisma/models/project.prisma`; cached `lib/prisma.ts` (`accelerateUrl` for `prisma+postgres://`, else `@prisma/adapter-pg`); migration `20261119072027_init` applied. Prisma 7 throughout.
- **06 Project APIs**: `GET`/`POST /api/projects`, `PATCH`/`DELETE /api/projects/[projectId]`. `401` signed out, `403` non-owner mutations, `404` missing, `400` bad input; responses use `{ error }`. Helpers in `lib/api-response.ts` and `lib/project-validation.ts`.
- **07 Wire Editor Home**: `/editor` is a server component (`EditorLoader`) that loads owned and shared projects via `lib/project-queries.ts`; `hooks/use-project-actions.ts` handles dialogs and mutations (create sends a client-generated `slug-suffix` ID that doubles as the room ID, then navigates; rename refreshes; delete redirects to `/editor` if it was the open workspace). `POST /api/projects` accepts an optional validated `id`.
- **08 Editor Workspace Shell**: `/editor/[roomId]` server page; signed out → `/sign-in`; missing or unauthorized → `AccessDenied`. `lib/project-access.ts` (`getCurrentIdentity`, `getProjectAccess`). Layout: navbar with project name, Share and AI toggle, `ProjectSidebar` with the current room highlighted, canvas area, right AI placeholder.
- **09 Share Dialog**: owners invite by email, view/remove collaborators, copy the link (`Copied!`); collaborators see the list only. API under `/api/projects/[projectId]/collaborators` (owner-only invite/remove via `authorizeProject`). Names and avatars come from the Clerk Backend API with an email-only fallback; no local user table.
- **App-wide restyle** (matches the share window): `components/app/` (`app-dialog`, `panel`, `pill-button`, `pill-input`, `badge`) applied to the share and project dialogs, sidebar, navbar, editor home, `AccessDenied`, and workspace; `components/ui/*` untouched. The share list shows the owner row and "N total"; the collaborators API returns `{ owner, collaborators }`. The Clerk sign-in/sign-up pages were left as they are.
- **10 Liveblocks Setup**: `liveblocks.config.ts` (`Presence`: cursor + `isThinking`; `UserMeta`: id + `info { name, avatar, color }`); cached lazy node client in `lib/liveblocks.ts`; `getCursorColor` in `lib/cursor-color.ts`; `POST /api/liveblocks-auth` (Clerk auth → project access `403` → create the private room only if needed → session token with name, avatar, color). Reads `LIVEBLOCKS_SECRET_KEY` from `.env.local` (now set).
- **11 Base Canvas**: `EditorCanvas` (`LiveblocksProvider`, `RoomProvider` with the project ID, `ClientSideSuspense`, error boundary with Reload) wrapping `CanvasFlow` (`useLiveblocksFlow` with suspense and empty initial state; `ReactFlow` with loose connections, `fitView`, `MiniMap`, dot background); `types/canvas.ts` (node/edge types, shapes, `NODE_COLORS`). No controls, custom rendering, persistence, or AI, per the scope limits.
- **12 Shape Panel**: `components/editor/shape-panel.tsx` (floating bottom-center pill toolbar; six draggable icon buttons with the shape and default size in the drag payload); `CanvasFlow` wraps `ReactFlow` in a div with `dragover`/`drop` handling (payload validated, `screenToFlowPosition`, node added through `onNodesChange` so it syncs via Liveblocks; empty label, default color, ID `shape-timestamp-counter`); `components/editor/canvas-node.tsx` registered as `canvasNode`, rendering every shape as a bordered rectangle with a centered label. `types/canvas.ts` gains `pill` and `hexagon`, `DEFAULT_SHAPE_SIZES`, `ShapeDragPayload`, `SHAPE_DRAG_MIME`.

### Fixes and cleanups

- **Route protection**: Clerk deprecated `createRouteMatcher`, so `proxy.ts` now only runs `clerkMiddleware()`. Every page and route handler checks auth itself. Documented in `architecture.md`, `code-standards.md`, and spec 03. Signed-out page requests now return `200` with a streamed redirect instead of a `307`.
- **Hooks refactor**: hooks used to call `fetch()` directly, against the standards. All network calls now live in client-safe wrappers in `lib/client/`; hooks hold UI state only.
- **UserButton hydration**: Clerk renders its container only after it loads, causing a hydration mismatch. `UserButton` now renders after mount with a placeholder.
- **DB SSL warning**: `sslmode=require` triggered a `pg` security warning. `DATABASE_URL` is now `sslmode=verify-full` and lives only in `.env` (a duplicate in `.env.local` was overriding it).
- **Dependency incident**: `package.json` had `prisma: ^6.12.0` and `shadcn: ^1.0.0` from outside my commits; an `npm install` then put a Prisma 6 CLI beside the Prisma 7 client. Restored `prisma: ^7.10.1` and `shadcn: ^4.23.0` and reinstalled; the Liveblocks and `@xyflow/react` additions were kept. If the downgrade was intentional, say so.
- **Prisma setup cleanup**: a stray Prisma 8 `init` was removed and the project standardized on Prisma 7.

## Verification Log

Checks that have run:

- `tsc`, `npm run lint`, `npm run build`: pass on the current tree.
- Signed out (dev and production servers): all API endpoints (`/api/projects…`, `/api/projects/[projectId]/collaborators…`, `/api/liveblocks-auth`) return JSON `401`; `/`, `/editor`, `/editor/<id>` render no app content and redirect to `/sign-in`; `/sign-in` and `/sign-up` return `200`.
- Database (rolled-back transaction): client-supplied project IDs insert, duplicates are rejected (maps to `409`), collaborator email match is case-insensitive, and deleting a project cascades.
- Liveblocks key: Next's env loader reads `LIVEBLOCKS_SECRET_KEY` from `.env.local` and the Liveblocks API accepts it (a read-only room listing succeeded).
- Env: Next's loader resolves `sslmode=verify-full` and a `pg` connect succeeds.

**Not verified** (needs a signed-in session in a browser): create/rename/delete, the sidebar and dialogs, the workspace and `AccessDenied`, the share dialog (invite, remove, copy link, Clerk names and avatars, the owner row), the restyle's appearance, the `UserButton` hydration fix, the sign-out redirect, a real Liveblocks token and room, and canvas connection.

## In Progress

- None.

## Next Up

1. Run the signed-in checklist (`LIVEBLOCKS_SECRET_KEY` is now in `.env.local`): create → lands on `/editor/<slug>-<suffix>`; rename; delete (including the open project); share dialog (invite a second account, copy link, remove); collaborator browser (link works, list read-only); made-up room ID shows `AccessDenied`; console clean (no hydration error); canvas loads (the room appears in the Liveblocks dashboard).
2. Merge specs 10 and 11 to `main` (the repo uses pull requests).
3. Decide what to do with the AI tooling scaffolding (see Open Questions) and the `AGENTS.md` that the dev server regenerates.
4. Known follow-ups: sidebar items as links so users can switch rooms; the default edge style from `ui-context.md`; live cursors; restyle the Clerk sign-in/sign-up pages; optionally a script that fails if a page or route has no auth check; optionally apply the Accelerate extension.
5. The next feature spec.

## Open Questions

- **AI tooling scaffolding**: `prisma init` generated `.agents/skills/prisma-*`, `.claude/`, `.cursor/`, `.devin/`, `.windsurf/`, `.gitattributes` (stale Prisma 8 paths), and `skills-lock.json` changes. Commit, gitignore, or delete? Also, `AGENTS.md` is regenerated by the dev server because of `experimental.agentFeedback` in `next.config.ts`; keep or turn off?
- **Docs inconsistency (already there before this work)**: `project-overview.md` says canvas snapshots persist to the filesystem, while `architecture.md` says Vercel Blob. `architecture.md` also has a leftover `[Layer] | [Technology] | [Role]` template row.
- **05**: `@prisma/extension-accelerate` is installed but not applied; `lib/prisma.ts` uses only the `accelerateUrl` option, and applying `.$extends(withAccelerate())` would change the client type. The Accelerate path is untested (only the direct `pg` path matches `.env`).
- **06**: `GET /api/projects` returns owned projects only (shared ones load through a server query); `404` for a missing project on `PATCH`/`DELETE`; rename requires a trimmed non-empty name; no maximum name length; the `Project` model has no `slug`.
- **07**: `POST /api/projects` accepts an optional client-supplied `id` so project ID and room ID stay aligned; the server query lives in `lib/project-queries.ts` rather than `lib/projects.ts` (client code imports that one); shared projects match the Clerk primary email.
- **08**: sidebar items are not links, so the highlight shows the current room but you can't switch rooms from it; the right AI placeholder is hidden below `md`; `AccessDenied` copy is mine; `getProjectAccess` returns `null` for both missing and unauthorized projects so existence isn't leaked; `ProjectSidebar` is a floating overlay rather than a docked panel.
- **09**: invite emails are stored lowercase (own email → `400`, duplicate → `409`); invitees need no Clerk account; the copy-link button is owner-only; the list loads when the dialog opens; Clerk enrichment covers only the first 100 collaborators; avatars use a plain `<img>`; no invitation email is sent.
- **10**: `LIVEBLOCKS_SECRET_KEY` lives in `.env.local` (set; the Liveblocks API accepts it, but no token or room has been created yet); the public key is stored as `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` but nothing reads it yet, because the app authenticates through `/api/liveblocks-auth` with the secret key; rooms are private (`defaultAccesses: []`); the cursor palette reuses the node text colors; missing and unauthorized projects both return `403`; a missing avatar becomes `""` and a missing name falls back to the email, then `Anonymous`; the route reads `{ room }` from the body; `UserMeta.id` is the Clerk user ID.
- **11**: `CANVAS_SHAPES` is `rectangle`, `circle`, `diamond`, `cylinder` (the spec gives none); `color` stores the node fill and its text color is looked up from the pair; the `canvasNode`/`canvasEdge` types are declared but not registered as `nodeTypes`/`edgeTypes`; the default edge style is not applied; the error boundary is a small custom class; the canvas imports React Flow's stylesheet with `colorMode="dark"` and CSS-variable overrides; the `Cursors` component is not rendered; React Flow attribution is left at its default; initial presence also sets `isThinking: false` because the type requires it.
- **12**: the spec gives sizes for rectangle, circle and diamond only; pill (160x64), cylinder (120x120) and hexagon (140x120) are my choices. The drop position is the node's top-left corner (not centered). Nodes get four loose-mode handles (top/right/bottom/left). The drag payload uses a custom MIME type, and drops without it are ignored. `canvasEdge` is still unregistered.

## Architecture Decisions

- Prisma 7 is the chosen ORM version (Prisma 8 is still a release candidate); do not mix Prisma 8 packages or configs into the project.
- Dark only: tokens live as CSS variables in `globals.css`; shadcn semantic variables alias the project tokens. `bg-base` is defined with `@utility` (not `--color-base`) to avoid colliding with the `text-base` font-size utility. `surface-border-subtle` is an extra utility for `--border-subtle`.
- The shadcn registry serves `import { cn } from "cn"` and lists the unrelated npm package `cn` as a dependency. With explicit permission, the generated `components/ui/*` imports were rewritten to `@/lib/utils` and the `cn` package removed. After any future `shadcn add`, re-apply: `sed -i 's#from "cn"#from "@/lib/utils"#' components/ui/*.tsx` and `npm uninstall cn`.
- `components/ui/*` stays default. The app look lives in `components/app/` (`AppDialog`, `Panel`, `PillButton`, `PillInput`, `Badge`); screens build from those (see `ui-context.md`).
- Route protection is resource-based: `proxy.ts` only runs `clerkMiddleware()`, and every page and route handler checks auth itself.
- Hooks hold UI state only; network calls live in `lib/client/`.
- The project ID is the Liveblocks room ID (slug + short suffix generated on the client, validated and uniqueness-checked by the API).
- `DATABASE_URL` lives only in `.env` (`sslmode=verify-full`); do not redefine it in `.env.local`.
- Liveblocks: one cached lazy node client in `lib/liveblocks.ts`; rooms are private and entered only with a session token from `/api/liveblocks-auth`.
- `ProjectSidebar` takes an optional `onClose` prop beyond the spec's `isOpen` so the close button works (confirmed acceptable by user).

## Session Notes

- `globals.css` previously held only `@import "tailwindcss"`; tokens were added from `ui-context.md`.
- This file was condensed after the spec 10/11 audit: per-unit entries are short summaries; the detailed reasoning is in the commit messages and the specs.
