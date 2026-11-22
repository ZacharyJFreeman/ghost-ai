Clerk is already installed and connected. Wire it into the Next.js app: provider, auth pages, redirects, route protection, and user menu.

## Design

Use Clerk's `dark` theme from `@clerk/ui/themes` as the base.

Override Clerk appearance variables using the app's existing CSS variables. Do not hardcode colors.

### Sign-in and sign-up pages:

- large screens: simple two-panel layout
- left: compact logo, tagline, short text-only feature list
- right: centered Clerk form
- small screens: form only
- no gradients
- no oversized hero sections
- no feature cards
- no scroll-heavy layouts

Keep the layout minimal and professional.

## Implementation

Wrap the root layout with `ClerkProvider` using Clerk's `dark` theme.

Create sign-in and sign-up pages using Clerk components.

Use `proxy.ts` at the project root, not `middleware.ts`.

Public routes are the sign-in and sign-up paths, taken from the existing sign-in and sign-up env vars.

Route protection is resource-based, not path-based (Clerk deprecated `createRouteMatcher`). `proxy.ts` only runs `clerkMiddleware()` so `auth()` works in server code. Every page and route handler that needs a signed-in user checks auth itself: pages redirect to `/sign-in`, and API routes return `401`. A new page or route that needs auth must add its own check.

Update `/`:

- authenticated users redirect to `/editor`
- unauthenticated users redirect to `/sign-in`

Add Clerk's built-in `UserButton` to the editor navbar right section for profile settings and logout.

Keep Clerk's default user menu and profile flows intact. Do not rebuild or heavily customize Clerk internals.

Use existing Clerk env vars. Do not rename or invent new ones.

## Dependencies

install: @clerk/ui.

## Check When Done

- `proxy.ts` exists at the root
- every page and route handler that needs a signed-in user checks auth itself (sign-in and sign-up are the only public paths)
- auth pages use CSS variables with no hardcoded colors
- `ClerkProvider` wraps the root layout
- `npm run build` passes

## Later Changes

These differ from the original text above and are intentional:

- **Feature list:** each item now has a small icon tile beside it, to match the provided design (originally "text-only", no feature cards). The layout is a 50/50 split.
- **Env var added:** `NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL=/sign-in` in `.env.local`, so sign-out from `/editor` does not redirect back to a protected page. It is a standard Clerk variable; not yet confirmed with a live sign-out.
- **User menu:** `UserButton` renders only after mount, with a same-size placeholder, to avoid a hydration mismatch (Clerk renders its container only once loaded).
- **Route protection:** resource-based, as described under Implementation (see `architecture.md` and `code-standards.md`).
