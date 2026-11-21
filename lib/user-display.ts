interface NamedUser {
  firstName: string | null
  lastName: string | null
  username: string | null
}

// Display name for a Clerk user: full name, else username, else null.
export function displayName(user: NamedUser): string | null {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || null
}
