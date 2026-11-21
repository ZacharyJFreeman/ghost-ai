import { clerkClient } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"

export interface Collaborator {
  id: string
  email: string
  name: string | null
  imageUrl: string | null
}

interface ClerkProfile {
  name: string | null
  imageUrl: string | null
}

// Clerk's emailAddress filter allows up to 100 addresses and the page size caps at 500.
const CLERK_EMAIL_LIMIT = 100
const CLERK_PAGE_LIMIT = 500

// Looks up display name + avatar for each email. Emails without a Clerk user
// (or any Clerk failure) are simply absent, so callers fall back to the email.
async function getClerkProfiles(emails: string[]): Promise<Map<string, ClerkProfile>> {
  const profiles = new Map<string, ClerkProfile>()

  try {
    const client = await clerkClient()
    const { data: users } = await client.users.getUserList({
      emailAddress: emails.slice(0, CLERK_EMAIL_LIMIT),
      limit: CLERK_PAGE_LIMIT,
    })

    for (const user of users) {
      const profile: ClerkProfile = {
        name:
          [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || null,
        imageUrl: user.imageUrl || null,
      }
      // The Clerk filter is a partial match, so key by each exact address.
      for (const { emailAddress } of user.emailAddresses) {
        profiles.set(emailAddress.toLowerCase(), profile)
      }
    }
  } catch {
    // Clerk unavailable: show emails only.
  }

  return profiles
}

// Server-only: collaborators of a project, enriched with Clerk user data.
export async function listCollaborators(projectId: string): Promise<Collaborator[]> {
  const rows = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true },
  })
  if (rows.length === 0) return []

  const profiles = await getClerkProfiles(rows.map((row) => row.email))

  return rows.map((row) => {
    const profile = profiles.get(row.email.toLowerCase())
    return { ...row, name: profile?.name ?? null, imageUrl: profile?.imageUrl ?? null }
  })
}
