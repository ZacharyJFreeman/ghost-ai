import { errorResponse, readJsonBody } from "@/lib/api-response"
import { getCursorColor } from "@/lib/cursor-color"
import { getLiveblocks } from "@/lib/liveblocks"
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access"

// Liveblocks calls this with `{ room }`; the room ID is the project ID.
export async function POST(request: Request) {
  // 1. Require Clerk authentication.
  const identity = await getCurrentIdentity()
  if (!identity) return errorResponse("Unauthorized", 401)

  const body = await readJsonBody(request)
  const room = body && typeof body === "object" ? (body as { room?: unknown }).room : undefined
  if (typeof room !== "string" || !room) return errorResponse("room is required", 400)

  // 2. Verify project access (owner or collaborator). A missing project and an
  // unauthorized one are both a 403.
  const access = await getProjectAccess(room, identity)
  if (!access) return errorResponse("Forbidden", 403)

  try {
    const liveblocks = getLiveblocks()

    // 3. Ensure the room exists, creating it only if needed. No default
    // access: only users holding a session token can enter.
    await liveblocks.getOrCreateRoom(room, { defaultAccesses: [] })

    // 4. Return a session token carrying the user's name, avatar and cursor color.
    const session = liveblocks.prepareSession(identity.userId, {
      userInfo: {
        name: identity.name ?? identity.email ?? "Anonymous",
        avatar: identity.imageUrl ?? "",
        color: getCursorColor(identity.userId),
      },
    })
    session.allow(room, session.FULL_ACCESS)

    const { status, body: token } = await session.authorize()
    return new Response(token, { status })
  } catch {
    return errorResponse("Realtime service unavailable", 502)
  }
}
