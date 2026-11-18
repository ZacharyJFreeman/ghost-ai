# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundation

## Current Goal

- 03 Auth — implemented (see Completed). Spec at `context/feature-specs/03-auth.md`.

## Completed

- 03 Auth (added standard Clerk sign-in/sign-up URL and force-redirect (to `/editor`) env vars to `.env.local`, confirmed by user): `ClerkProvider` (in `Suspense`, for Cache Components) wraps root layout with `dark` theme from `@clerk/ui/themes` + variables mapped to CSS vars (`lib/clerk-appearance.ts`); `(auth)` route group with two-panel `AuthShell` and `SignIn`/`SignUp` pages; root `proxy.ts` protects all routes except sign-in/sign-up (from env vars); `/` redirects to `/editor` or `/sign-in`; `UserButton` in editor navbar right section; `/editor` page mounts navbar + sidebar via `components/editor/editor-shell.tsx`. Installed `@clerk/ui`. `npm run build` and `npm run lint` pass; no browser check with a live sign-in.

- 02 Editor navbar: `components/editor/editor-navbar.tsx` — `h-12` top bar with left/center/right sections (center and right empty), ghost icon button toggling `PanelLeftOpen`/`PanelLeftClose` from `isOpen`, optional `onToggle` handler; uses `bg-surface` + `border-surface-border`. Added from the user's expected-output screenshot (not in the spec file).
- 02 Editor: `components/editor/project-sidebar.tsx` (floating left sidebar, fixed overlay so it doesn't push content, slides in via translate, `isOpen` prop, `Projects` header + close button, shadcn Tabs "My Projects"/"Shared" with empty placeholders, full-width `New Project` button with `Plus` icon). Dialog pattern is already satisfied by `components/ui/dialog.tsx` (DialogHeader/Title/Description/Footer) — no new component; no actual dialogs built. `tsc` and `npm run lint` pass. Not yet mounted on a page; no browser check run.
- 01 Design System: shadcn/ui (base-nova style, Base UI primitives) with Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea in `components/ui/` (only change: `cn` import rewritten to `@/lib/utils`, see Architecture Decisions); `lucide-react`; `lib/utils.ts` `cn()` (clsx + tailwind-merge); dark-only theme tokens in `app/globals.css` with shadcn variables mapped onto them; `dark` class on `<html>`. `tsc`, `npm run build`, and `npm run lint` pass.

## In Progress

- None.

## Next Up

- Add the next planned feature unit here.

## Open Questions

- The sidebar spec lists only `isOpen`; an optional `onClose` prop was added so the close button can work. Confirm this is acceptable.

## Architecture Decisions

- Dark only: tokens live as CSS variables in `globals.css`; shadcn semantic variables (`--background`, `--primary`, …) alias the project tokens. `bg-base` is defined with `@utility` (not `--color-base`) to avoid colliding with the `text-base` font-size utility.
- The shadcn registry (all styles, CLI 4.23.0) serves `import { cn } from "cn"` and lists the unrelated npm package `cn` as a dependency. With explicit permission, the generated `components/ui/*` imports were rewritten to `@/lib/utils` and the `cn` package removed. After any future `shadcn add`, re-apply: `sed -i 's#from "cn"#from "@/lib/utils"#' components/ui/*.tsx` and `npm uninstall cn`.
- Dialog pattern (from `02-editor.md`): dialogs use the existing `globals.css` color tokens and must support title, description, and footer actions. No actual dialogs are to be built yet.
- Added `surface-border-subtle` utility for `--border-subtle` (not previously named in `ui-context.md`).

## Session Notes

- `globals.css` previously held only `@import "tailwindcss"`; tokens were added from `ui-context.md`.
- Verified with a temporary page importing all components (removed afterwards); no visual/browser check was run.
