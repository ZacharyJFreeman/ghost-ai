# UI Context

## Theme

Dark only. No light mode. The visual language is a dark technical workspace — near-black backgrounds, layered surfaces, and vivid accent colors for interactive elements.

All colors are defined as CSS custom properties in `globals.css` and mapped to Tailwind tokens via `@theme inline`. Components must use these tokens — no hardcoded hex values or raw Tailwind color classes like `zinc-*`.

| Role             | CSS Variable       | Hex / Value |
| ---------------- | ------------------ | ----------- |
| Page background  | `--bg-base`        | `#080809`   |
| Surface          | `--bg-surface`     | `#111114`   |
| Elevated surface | `--bg-elevated`    | `#18181c`   |
| Subtle surface   | `--bg-subtle`      | `#1e1e23`   |
| Default border   | `--border-default` | `#2a2a30`   |
| Subtle border    | `--border-subtle`  | `#3a3a42`   |
| Primary text     | `--text-primary`   | `#f0f0f4`   |
| Secondary text   | `--text-secondary` | `#c0c0cc`   |
| Muted text       | `--text-muted`     | `#808090`   |
| Faint text       | `--text-faint`     | `#505060`   |
| Brand accent     | `--accent-primary`     | `#00c8d4` (cyan)               |
| Brand dim        | `--accent-primary-dim` | `rgba(0, 200, 212, 0.12)`      |
| AI accent        | `--accent-ai`          | `#6457f9` (indigo-purple)      |
| AI text          | `--accent-ai-text`     | `#8b82ff`                      |
| Error            | `--state-error`        | `#ff4d4f`                      |
| Success          | `--state-success`      | `#34d399`                      |
| Warning          | `--state-warning`      | `#fbbf24`                      |

Tailwind utility names map to these variables. Use `bg-base`, `bg-surface`, `text-copy-primary`, `text-copy-muted`, `border-surface-border`, `text-brand`, `bg-accent-dim`, etc.

## Typography

| Role      | Font       | CSS Variable         |
| --------- | ---------- | -------------------- |
| UI text   | Geist Sans | `--font-geist-sans`  |
| Code/mono | Geist Mono | `--font-geist-mono`  |

Both fonts are loaded via `next/font/google` and applied as CSS variables on the `<html>` element. The base `body` uses Geist Sans with `antialiased`.

## Border Radius

| Context           | Class         |
| ----------------- | ------------- |
| Inline / small UI | `rounded-xl`  |
| Cards / panels    | `rounded-2xl` |
| Modal / overlay   | `rounded-3xl` |
| Controls (inputs, buttons, tabs), badges, avatars | `rounded-full` (pill) |

## Canvas

### Node Color Palette

8 defined color pairs. Each pair specifies a dark node fill and a vivid contrasting text color tuned for readability on the dark canvas. Defined in `types/canvas.ts` as `NODE_COLORS`.

| Node fill | Text color | Character            |
| --------- | ---------- | -------------------- |
| `#1F1F1F` | `#EDEDED`  | Neutral dark (default) |
| `#10233D` | `#52A8FF`  | Blue                 |
| `#2E1938` | `#BF7AF0`  | Purple               |
| `#331B00` | `#FF990A`  | Orange               |
| `#3C1618` | `#FF6166`  | Red                  |
| `#3A1726` | `#F75F8F`  | Pink                 |
| `#0F2E18` | `#62C073`  | Green                |
| `#062822` | `#0AC7B4`  | Teal                 |

Default node color: `#1F1F1F` with `#EDEDED` text.

### Edge Style

Smooth-step path with an arrow marker. Default edge color: `#f8fafc`. Stroke width is thin — edges are visually secondary to nodes.

Current implementation (spec 22): every edge ends in a closed arrowhead at its target, set once through React Flow `defaultEdgeOptions` (nothing is stored per edge). The line and arrowhead share one color through React Flow's `--xy-edge-stroke` variable, set to `--text-muted` (`--text-secondary` when selected). The smooth-step path and the `#f8fafc` color above are still a follow-up; edges use React Flow's default bezier path, drawn by `components/editor/canvas-edge.tsx` (same path, plus the optional text box).

### Canvas Interactions

- Dragging empty canvas draws a selection box (accent border and `--accent-primary-dim` fill, through React Flow's `--xy-selection-*` variables); middle/right-drag pans.
- Double-clicking empty canvas toggles pan mode (left-drag pans, a "Pan mode" status chip shows at the top center); double-click again or `Esc` exits.
- A selected group moves together; the color toolbar and resize handles show only when exactly one shape is selected.
- Clicking a line adds a text box over its middle (a rounded input, part of the line, not a shape; it cannot be moved and is removed when its text is cleared); double-clicking a line deletes it.
- An info button at the end of the bottom toolbar opens a centered "Canvas shortcuts and controls" dialog (`canvas-help-dialog.tsx`, built on `AppDialog`) listing every shortcut and gesture; clicking outside it, `Esc`, or the close button closes it.
- Shortcuts: `Cmd/Ctrl + A / C / X / V / D` (select all, copy, cut, paste, duplicate), `Enter` edits the selected shape's label.

## Component Library

shadcn/ui on top of Tailwind. Components live in `components/ui/` and are treated as protected foundation components. Use the CLI to add new components rather than writing them from scratch, and put project-specific styling in app-level components instead of editing `components/ui/*`.

## App Components

The share dialog defines the visual language for the whole app: a large rounded dialog frame, a header with a divider, content grouped in bordered rounded panels, pill-shaped controls, and small uppercase badges. This look lives in `components/app/` (not in `components/ui/*`, which stays default). Screens must use these instead of restyling shadcn components ad hoc:

| Component              | Purpose |
| ---------------------- | ------- |
| `app-dialog.tsx`       | Dialog shell: `rounded-3xl`, `bg-surface` frame, header with divider and its own close button, padded body, optional footer. Wraps `ui/dialog`. |
| `panel.tsx`            | Bordered `rounded-2xl` section on `bg-base`, with optional title, description and right-side action. |
| `pill-button.tsx`      | Pill buttons: `primary` (brand fill), `dark` (secondary), `danger` (red tint), `ghost`; sizes `default`, `sm`, `icon`, `icon-sm`. `pillButtonClasses()` styles links the same way. |
| `pill-input.tsx`       | Fully rounded input with an optional leading icon. |
| `badge.tsx`            | Uppercase, letter-spaced pill label; `brand` and `muted` tones. |

List rows (people, projects) are bordered `rounded-2xl` rows on `bg-base`; the current item uses `border-brand/40 bg-accent-dim`. Destructive row actions are red icon-only pill buttons.

Not yet applied: the Clerk sign-in/sign-up pages (`components/auth/auth-shell.tsx`, `lib/clerk-appearance.ts`).

## Layout Patterns

- Editor: full-viewport split with a left sidebar, center canvas, and right sidebar.
- Sidebars: fixed width with a `border-surface-border` separator.
- Modals: centered overlay with backdrop blur and `rounded-3xl`.
- Navbar: top bar with a bottom border.

## Icons

Lucide React. Stroke-based icons only. Sizes: `h-4 w-4` for inline, `h-5 w-5` for buttons.
