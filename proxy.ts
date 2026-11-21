import { clerkMiddleware } from "@clerk/nextjs/server"

// Runs Clerk so `auth()` / `currentUser()` work in server code. Route protection
// is not done here: every page and route handler that needs a signed-in user
// checks auth itself (pages redirect to the sign-in URL, API routes return 401).
export default clerkMiddleware()

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
