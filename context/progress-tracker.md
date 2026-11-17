# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundation

## Current Goal

- Define the next feature unit after 01 Design System.

## Completed

- 01 Design System: shadcn/ui (base-nova style, Base UI primitives) with Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea in `components/ui/` (only change: `cn` import rewritten to `@/lib/utils`, see Architecture Decisions); `lucide-react`; `lib/utils.ts` `cn()` (clsx + tailwind-merge); dark-only theme tokens in `app/globals.css` with shadcn variables mapped onto them; `dark` class on `<html>`. `tsc`, `npm run build`, and `npm run lint` pass.

## In Progress

- None.

## Next Up

- Add the next planned feature unit here.

## Open Questions

- None.

## Architecture Decisions

- Dark only: tokens live as CSS variables in `globals.css`; shadcn semantic variables (`--background`, `--primary`, …) alias the project tokens. `bg-base` is defined with `@utility` (not `--color-base`) to avoid colliding with the `text-base` font-size utility.
- The shadcn registry (all styles, CLI 4.23.0) serves `import { cn } from "cn"` and lists the unrelated npm package `cn` as a dependency. With explicit permission, the generated `components/ui/*` imports were rewritten to `@/lib/utils` and the `cn` package removed. After any future `shadcn add`, re-apply: `sed -i 's#from "cn"#from "@/lib/utils"#' components/ui/*.tsx` and `npm uninstall cn`.
- Added `surface-border-subtle` utility for `--border-subtle` (not previously named in `ui-context.md`).

## Session Notes

- `globals.css` previously held only `@import "tailwindcss"`; tokens were added from `ui-context.md`.
- Verified with a temporary page importing all components (removed afterwards); no visual/browser check was run.
