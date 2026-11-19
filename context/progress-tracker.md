# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundation

## Current Goal

- 04 Project Dialogs — implemented (see Completed). Spec at `context/feature-specs/04-project-dialogs.md`.

## Completed

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


- 04 (confirmed acceptable by user; may need to be removed in the future): behaviors not defined in the spec that were chosen during implementation: (a) mock submit simulates 400ms latency and mutates local state only (lost on refresh); (b) renaming also regenerates the slug; (c) dialog titles/descriptions/button labels (`Create project`, `Rename`, `Delete`, `Cancel`); (d) sidebar tabs now list mock projects (owned under My Projects, others under Shared); (e) `hooks/` introduced as a new top-level directory.

## Architecture Decisions

- Dark only: tokens live as CSS variables in `globals.css`; shadcn semantic variables (`--background`, `--primary`, …) alias the project tokens. `bg-base` is defined with `@utility` (not `--color-base`) to avoid colliding with the `text-base` font-size utility.
- The shadcn registry (all styles, CLI 4.23.0) serves `import { cn } from "cn"` and lists the unrelated npm package `cn` as a dependency. With explicit permission, the generated `components/ui/*` imports were rewritten to `@/lib/utils` and the `cn` package removed. After any future `shadcn add`, re-apply: `sed -i 's#from "cn"#from "@/lib/utils"#' components/ui/*.tsx` and `npm uninstall cn`.
- Dialog pattern (from `02-editor.md`): dialogs use the existing `globals.css` color tokens and must support title, description, and footer actions. No actual dialogs are to be built yet.
- Sidebar takes an optional `onClose` prop beyond the spec's `isOpen` so the close button works (confirmed acceptable by user).
- Added `surface-border-subtle` utility for `--border-subtle` (not previously named in `ui-context.md`).

## Session Notes

- `globals.css` previously held only `@import "tailwindcss"`; tokens were added from `ui-context.md`.
- Verified with a temporary page importing all components (removed afterwards); no visual/browser check was run.
