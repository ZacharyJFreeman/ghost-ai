# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundation

## Current Goal

- 18 Starter Template — implemented and wired into Create project (not committed; not browser-verified); 17 Canvas Ergonomics — implemented (not committed; not browser-verified); 15 Nodes Colour Toolbar — committed; 14 Node Editing — implemented (not committed); 13 is implemented (not committed); 11 and 12 are pushed; all wait on signed-in browser verification (see Next Up).

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
- **12 Shape Panel**: `components/editor/shape-panel.tsx` (floating bottom-center pill toolbar; six draggable icon buttons with the shape and default size in the drag payload); `CanvasFlow` wraps `ReactFlow` in a div with `dragover`/`drop` handling (payload validated, `screenToFlowPosition`, node added through `onNodesChange` so it syncs via Liveblocks; empty label, default color, ID `shape-timestamp-counter`); `components/editor/canvas-node.tsx` registered as `canvasNode`, rendering each shape (rectangle, circle and pill as bordered boxes; diamond, hexagon and cylinder as stretched SVG outlines) with a centered label. `types/canvas.ts` gains `pill` and `hexagon`, `DEFAULT_SHAPE_SIZES`, `ShapeDragPayload`, `SHAPE_DRAG_MIME`.

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
- **13 Node Shape** (`13-node-shape`): shape rendering moved into a shared `components/editor/shape-view.tsx` (rectangle, pill, circle as CSS; diamond, hexagon, cylinder as SVG scaled to node size; border subtle at rest via `color-mix`, full strength when selected), used by `canvas-node.tsx`. `ShapePanel` shows a ghost preview while dragging: the native drag image is replaced with a transparent one, and a fixed, 60% opacity `ShapeView` at the default size follows the cursor (tracked through document `dragover`) and is removed on `dragend` (drop or cancel). Click-to-place from the extras file is kept as step 4 of this spec.
- **14 Node Editing** (`14-node-editing.md`): `canvas-node.tsx` shows a subtle `NodeResizer` on selected nodes (minimum 60x40); double-clicking the centered label box swaps in a transparent textarea over it (a hidden mirror sizes the box, so nothing shifts), the label updates on each keystroke through `useReactFlow().updateNodeData`, and editing closes on blur or `Escape`; the textarea uses `nodrag nopan nowheel` and stops key events so typing never drags, pans, or deletes. An empty label shows a dimmed "Label" placeholder in the same spot. Resizes and label edits sync because the Liveblocks hook handles React Flow `dimensions` and `replace` changes.
- **15 Nodes Colour Toolbar** (`15-nodes-colour-toolbar.md`): new `components/editor/node-color-toolbar.tsx` renders a React Flow `NodeToolbar` (12px above the node, visible only when selected) with one swatch per `NODE_COLORS` pair (palette already existed in `types/canvas.ts`, so nothing new was added). The active swatch gets a text-color ring; hovering shows a tight glow (6px blur) from the pair's text color. The toolbar uses `nodrag nopan` and stops pointer/mouse/click propagation so it never drags the node or pans. Selecting a swatch calls `updateNodeData(id, { color })`, so it syncs through the existing Liveblocks state with no server calls; the text color follows from the pair lookup in `canvas-node.tsx`. `npm run build` passes; the toolbar is not tested in a browser.
- **17 Canvas Ergonomics** (`17-canvas-ergonomics.md`): `components/editor/canvas-controls.tsx` renders inside the centre shape panel pill (passed as `ShapePanel` children, after the shapes, behind a divider; spec step 7 merged the former bottom-left bar into it) with zoom out / fit view / zoom in, a thin divider, and undo / redo; zoom uses 200ms animations on the React Flow instance; undo/redo use Liveblocks `useUndo`/`useRedo`, with `useCanUndo`/`useCanRedo` disabling and dimming the buttons. `hooks/use-keyboard-shortcuts.ts` listens on `window` (ignores inputs, textareas, selects, contenteditable): `+`/`=` zoom in, `-` zoom out, Cmd/Ctrl+Z undo, Cmd/Ctrl+Shift+Z and Cmd/Ctrl+Y redo. The spec says "add a button to collapse the mini map" (an earlier draft said remove it), so a small toggle button sits above the minimap at bottom-right and shows a down chevron to collapse and an up chevron to expand (in the corner when collapsed). Control clicks do not place a highlighted shape. Not tested in a browser; whether Liveblocks history records React Flow node/edge changes made through `useLiveblocksFlow` is untested.
- **18 Starter Template** (`18-starter-template.md`): `components/editor/starter-templates.ts` exports `CanvasTemplate` and `CANVAS_TEMPLATES` (Microservices, CI/CD Pipeline, Event-Driven System), built with small `node()`/`edge()` helpers, a named palette from `NODE_COLORS`, and `DEFAULT_SHAPE_SIZES`; edges name their handles (`right` to `left`, or `bottom` to `top`). `starter-templates-modal.tsx` is an `AppDialog` with a scrollable card grid (name, description, Import button that calls `onImport(template)` then closes) and a static preview: bounds from node positions, scaled to a fixed 280x150 viewport, SVG lines between node centers, nodes drawn with `ShapeView` (no React Flow instance, no labels). Wiring (added on request, not in the spec): the Create project dialog has a "Starter template" row (Browse/Change opens the modal, X clears it); `useProjectActions` holds `template`/`templatesOpen`; on create the template ID goes to sessionStorage keyed by room ID (`lib/pending-template.ts`), and `CanvasFlow` takes it once on load, adds the nodes and edges through `onNodesChange`/`onEdgesChange` only if the canvas is empty, then fits the view. Not tested in a browser: the modal opening on top of the create dialog, and whether edge `add` changes sync through the Liveblocks hook.
- **12 extras** (`12-shape-pannel-extras.md`): clicking a panel icon highlights it (click again to clear); the next click inside the canvas places that shape at the click point and clears the highlight; a click outside the canvas resets it; clicks on the panel or minimap do not place; dragging still works.
- **11**: `CANVAS_SHAPES` is `rectangle`, `circle`, `diamond`, `cylinder` (the spec gives none); `color` stores the node fill and its text color is looked up from the pair; the `canvasNode`/`canvasEdge` types are declared but not registered as `nodeTypes`/`edgeTypes`; the default edge style is not applied; the error boundary is a small custom class; the canvas imports React Flow's stylesheet with `colorMode="dark"` and CSS-variable overrides; the `Cursors` component is not rendered; React Flow attribution is left at its default; initial presence also sets `isThinking: false` because the type requires it.
- **12**: the spec gives sizes for rectangle, circle and diamond only; pill (160x64), cylinder (120x120) and hexagon (140x120) are my choices. The drop position is the node's top-left corner (not centered). Nodes get four loose-mode handles (top/right/bottom/left). The drag payload uses a custom MIME type, and drops without it are ignored. `canvasEdge` is still unregistered.
- **13**: the ghost preview anchors its top-left corner at the cursor so it matches where the node lands; it shows at the default size in screen pixels (not scaled by canvas zoom); it shows only once the first `dragover` reports coordinates. Unselected CSS shapes use a 45% border; the SVG fill keeps the node color.
- **14**: the placeholder text "Label", the minimum size (60x40), and the subtle handle style are my choices; the placeholder is always shown on empty nodes (not only when selected); `Enter` inserts a newline; label changes sync per keystroke, so collaborators see typing live; label sync relies on the Liveblocks hook's `replace` handling of `updateNodeData`, which is not tested in a browser; the label no longer renders inside `ShapeView` (it is overlaid by the node).

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
