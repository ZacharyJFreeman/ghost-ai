Complete the existing AI sidebar placeholder and turn it into a proper floating chat sidebar component. The sidebar already exists, so keep the current floating placement and smooth slide-in behavior from the right side. This unit is focused on building out the sidebar UI inside it.

## Implementation

1. Separate the AI sidebar into its own component.
   - keep the open/close state controlled by the parent
   - preserve the existing slide animation, floating position, border, background, and shadow styling
   - use sidebar surface styles like `bg-base/95`, `border-surface-border`, and the current shadow treatment

2. Add the sidebar header.
   - title: `AI Workspace`
   - subtitle: `Collaborate with Ghost AI`
   - small bot icon
   - close button aligned to the right
   - use `text-primary-text` for the title
   - use `text-muted-text` for the subtitle

3. Add a tabbed layout with two tabs.

   Use shadcn `Tabs`.
   - `AI Architect`
   - `Specs`
   - active tab should use the accent styling, like `bg-accent` and `text-accent`
   - inactive tab text should stay muted with `text-muted-text`

4. Build the AI Architect tab.

<!-- Lines 27-31 (the start of step 4, ending with "starter chips:") were not visible in the screenshot. -->
   - `Design an e-commerce backend`
   - `Create a chat app architecture`
   - `Build a CI/CD pipeline`
   - style starter chips as soft pills using `bg-subtle` and `text-accent-text`
   - user messages should be right-aligned with `bg-brand-dim border-brand/50 border-2 text-copy-primary`
   - assistant messages should be left-aligned with `bg-elevated border border-surface-border text-accent-text`
   - input area with an auto-resizing textarea, around 72px min height and 160px max height
   - send button should use `bg-accent text-white`
   - `Enter` submits, `Shift+Enter` adds a newline

5. Build the Specs tab.
   - show a `Generate Spec` button using `bg-accent text-white`
   - show a demo spec card for now
   - style the card with `bg-elevated` and `border-surface-border`
   - include a file/spec icon, title, short snippet, and disabled download action

6. Use the existing project color tokens.

   Check `globals.css`, `ui-context.md` or the Tailwind mapping before adding direct color values. Avoid inventing new colors if a matching token already exists.

## Scope Limits

- don’t rebuild the existing sidebar open/close behavior
- don’t add backend logic
- don’t add Liveblocks or AI generation logic yet
- keep this focused on the sidebar UI structure

## Check When Done

- The AI sidebar is its own component, with open/close state controlled by the parent.
- The existing floating position and slide-in animation from the right still work.
- The header shows the bot icon, `AI Workspace`, `Collaborate with Ghost AI`, and a close button on the right.
- The `AI Architect` and `Specs` tabs switch correctly, with the active tab in the accent style and the inactive tab muted.
- The AI Architect tab shows the three starter chips, styled user and assistant messages, and an auto-resizing input; `Enter` sends and `Shift+Enter` adds a newline.
- The Specs tab shows the `Generate Spec` button and a demo spec card with a disabled download action.
- Colors come from existing project tokens, with no new hardcoded colors.
- `npm run build` passes without type errors.
