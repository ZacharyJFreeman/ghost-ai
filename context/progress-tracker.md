# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundation

## Current Goal

- 06 Project APIs — implemented (see Completed). Spec at `context/feature-specs/06-project-apis.md`.

## Completed

- 06 Project APIs (implemented, backend only, awaiting live check; uncommitted): `app/api/projects/route.ts` (`GET` lists the current user's owned projects, newest first → `{ projects }`; `POST` creates with `ownerId` = Clerk user ID, blank/missing name → `Untitled Project`, Prisma `cuid()` ID → `201 { project }`) and `app/api/projects/[projectId]/route.ts` (`PATCH` rename → `{ project }`; `DELETE` → `{ success: true }`; both check ownership before mutating: `404` if the project doesn't exist, `403` if not the owner). Unauthenticated → `401 { error }`; bad input → `400 { error }`; all errors use `{ error }`. Helpers: `lib/api-response.ts` (`errorResponse`, `getAuthenticatedUserId`, `readJsonBody`) and `lib/project-validation.ts` (name parsing). `proxy.ts` now treats `/api(.*)` as non-protected so the handlers return their own JSON `401` instead of Clerk's `auth.protect()` redirect/404; every handler still authenticates. UI is not wired (still mock data). `tsc`, `npm run lint`, and `npm run build` pass; routes were not called against a running server.

- 05 Prisma (implemented; uncommitted): `prisma/models/project.prisma` with `ProjectStatus` enum (`DRAFT`, `ARCHIVED`), `Project` (cuid id, `ownerId` = Clerk user ID, name, optional description, status default `DRAFT`, `canvasJsonPath?`, `createdAt`/`updatedAt`, indexes on `ownerId` and `createdAt`) and `ProjectCollaborator` (project relation `onDelete: Cascade`, email, `createdAt`, `@@unique([projectId, email])`, indexes on `email` and `[projectId, createdAt]`). `lib/prisma.ts`: cached singleton on `globalThis` (dev only); `prisma+postgres://` URLs use `new PrismaClient({ accelerateUrl })`, otherwise `PrismaPg` adapter. Ran `prisma migrate dev --name init` (migration `20261119072027_init` created and applied) and `prisma generate`. `prisma validate`, `tsc`, `npm run lint`, and `npm run build` pass. Nothing imports `lib/prisma.ts` yet; no queries or API routes.

- Prisma setup (init; models added in 05 above; uncommitted): standardized on Prisma 7 (`prisma`, `@prisma/client`, `@prisma/adapter-pg` all `^7.10.1`, plus `pg`, `dotenv`). A stray `prisma orm init` (Prisma 8) had left a half-8/half-7 state — removed its scaffold (`prisma.config.ts`, `src/prisma/*`, `prisma-8.md`, `contract:emit` script, `@prisma/orm-postgres`, tsconfig `types` change) and the typo package `dotevn`. Then ran `npx prisma init --output ../app/generated/prisma`: created `prisma/schema.prisma` (generator `prisma-client` → `app/generated/prisma`, provider `postgresql`, no models) and `prisma7.config.ts` (auto-detected by the CLI; `prisma validate` passes). `/app/generated/prisma` added to `.gitignore`; existing `.env` `DATABASE_URL` left untouched. `tsc` and lint pass; no client generated, no migration, no `lib/` client yet.

- 04 Project Dialogs (implemented, awaiting browser check): `components/editor/editor-home.tsx` (centered heading, description, `New Project` button with `Plus`, no cards); `components/editor/project-dialogs.tsx` (Create with live slug preview, Rename prefilled + auto-focus + Enter submits + current name in description, Delete confirmation with destructive button, no input); `hooks/use-project-dialogs.ts` (dialog, form, loading state; mock submit with 400ms delay updating local state only); `lib/projects.ts` (`Project`, `slugify`, mock data). Sidebar now lists projects with rename/delete actions for owned projects only (hidden for shared), `New Project` wired to Create, and a mobile-only backdrop scrim that closes the sidebar on tap. `EditorShell` wires everything. Design-system check against `01-design-system.md`/`code-standards.md`: `components/ui/*` untouched (git shows no changes); fixed two token violations in the sidebar (scrim `bg-black/60` → `bg-background/70`, item hover `bg-surface-border-subtle` → `bg-subtle`); no raw colors remain in new files. Context-files audit: dialogs pass `className="rounded-3xl"` to `DialogContent` (app-level override, `ui/dialog` untouched; backdrop blur comes from the generated overlay); removed unnecessary `"use client"` from `editor-home.tsx`/`project-dialogs.tsx` (they render only under the client `EditorShell`); `ProjectDialogsProps` is now an `interface`; added `hooks/` to `architecture.md` boundaries and `code-standards.md` file organization. Slug validation fix (from user screenshot): names that slugify to empty (e.g. `!@#!@#!`, non-Latin-only) previously left Create enabled; now Create/Rename are disabled when the slug is empty, the input shows `aria-invalid` plus a "must include at least one letter or number" error, and `submit` in the hook also rejects empty slugs. `tsc`, `npm run lint`, and `npm run build` pass (build last run before the slug fix; `tsc` and lint re-run after); no browser check run.

- Auth fix: added `NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL=/sign-in` to `.env.local` so sign-out from `/editor` no longer redirects back to a protected page (suspected cause of the "unexpected response from the server" error). Not yet confirmed with a live sign-out. The `__clerk_handshake` URL on first sign-in is normal Clerk dev-instance behavior (`dev-browser-missing`); no change made.

- 03 Auth (added standard Clerk sign-in/sign-up URL and force-redirect (to `/editor`) env vars to `.env.local`, confirmed by user): `ClerkProvider` (in `Suspense`, for Cache Components) wraps root layout with `dark` theme from `@clerk/ui/themes` + variables mapped to CSS vars (`lib/clerk-appearance.ts`); `(auth)` route group with two-panel `AuthShell` and `SignIn`/`SignUp` pages; root `proxy.ts` protects all routes except sign-in/sign-up (from env vars); `/` redirects to `/editor` or `/sign-in`; `UserButton` in editor navbar right section; `/editor` page mounts navbar + sidebar via `components/editor/editor-shell.tsx`. Installed `@clerk/ui`. `npm run build` and `npm run lint` pass; no browser check with a live sign-in.

- 02 Editor navbar: `components/editor/editor-navbar.tsx` — `h-12` top bar with left/center/right sections (center and right empty), ghost icon button toggling `PanelLeftOpen`/`PanelLeftClose` from `isOpen`, optional `onToggle` handler; uses `bg-surface` + `border-surface-border`. Added from the user's expected-output screenshot (not in the spec file).
- 02 Editor: `components/editor/project-sidebar.tsx` (floating left sidebar, fixed overlay so it doesn't push content, slides in via translate, `isOpen` prop, `Projects` header + close button, shadcn Tabs "My Projects"/"Shared" with empty placeholders, full-width `New Project` button with `Plus` icon). Dialog pattern is already satisfied by `components/ui/dialog.tsx` (DialogHeader/Title/Description/Footer) — no new component; no actual dialogs built. `tsc` and `npm run lint` pass. Not yet mounted on a page; no browser check run.
- 01 Design System: shadcn/ui (base-nova style, Base UI primitives) with Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea in `components/ui/` (only change: `cn` import rewritten to `@/lib/utils`, see Architecture Decisions); `lucide-react`; `lib/utils.ts` `cn()` (clsx + tailwind-merge); dark-only theme tokens in `app/globals.css` with shadcn variables mapped onto them; `dark` class on `<html>`. `tsc`, `npm run build`, and `npm run lint` pass.

## In Progress

- None.

## Next Up

- Add the next planned feature unit here.

## Open Questions

- 06: choices not defined in the spec: (a) `GET` returns only owned projects (not collaborator/shared ones); (b) missing project on `PATCH`/`DELETE` returns `404`; (c) rename requires a non-empty string `name` (`400` otherwise) and names are trimmed; (d) no max name length; (e) `/api` excluded from the `proxy.ts` `auth.protect()` gate to get a true `401`; (f) the `Project` model has no `slug`, so none is returned or stored.

- 05: `@prisma/extension-accelerate` is now installed (user request) but not yet applied in `lib/prisma.ts`, which still uses only the `accelerateUrl` client option. Applying `.$extends(withAccelerate())` would change the client's type vs. the direct `pg` branch; decide when caching is needed. The Accelerate path is untested; only the direct `pg` path matches the current `.env`.

- 04 (confirmed acceptable by user; may need to be removed in the future): behaviors not defined in the spec that were chosen during implementation: (a) mock submit simulates 400ms latency and mutates local state only (lost on refresh); (b) renaming also regenerates the slug; (c) dialog titles/descriptions/button labels (`Create project`, `Rename`, `Delete`, `Cancel`); (d) sidebar tabs now list mock projects (owned under My Projects, others under Shared); (e) `hooks/` introduced as a new top-level directory.

- `prisma init` also generated AI-tool scaffolding (`.agents/skills/prisma-*`, `.claude/`, `.cursor/`, `.devin/`, `.windsurf/`, `.gitattributes`, `skills-lock.json` changes). Decide whether to commit, gitignore, or delete these.

## Architecture Decisions

- Prisma 7 is the chosen ORM version (Prisma 8 is still a release candidate); do not mix Prisma 8 packages/configs into the project.

- Dark only: tokens live as CSS variables in `globals.css`; shadcn semantic variables (`--background`, `--primary`, …) alias the project tokens. `bg-base` is defined with `@utility` (not `--color-base`) to avoid colliding with the `text-base` font-size utility.
- The shadcn registry (all styles, CLI 4.23.0) serves `import { cn } from "cn"` and lists the unrelated npm package `cn` as a dependency. With explicit permission, the generated `components/ui/*` imports were rewritten to `@/lib/utils` and the `cn` package removed. After any future `shadcn add`, re-apply: `sed -i 's#from "cn"#from "@/lib/utils"#' components/ui/*.tsx` and `npm uninstall cn`.
- Dialog pattern (from `02-editor.md`): dialogs use the existing `globals.css` color tokens and must support title, description, and footer actions. No actual dialogs are to be built yet.
- Sidebar takes an optional `onClose` prop beyond the spec's `isOpen` so the close button works (confirmed acceptable by user).
- Added `surface-border-subtle` utility for `--border-subtle` (not previously named in `ui-context.md`).

## Session Notes

- `globals.css` previously held only `@import "tailwindcss"`; tokens were added from `ui-context.md`.
- Verified with a temporary page importing all components (removed afterwards); no visual/browser check was run.
