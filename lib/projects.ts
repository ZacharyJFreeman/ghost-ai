export interface Project {
  id: string
  name: string
  isOwner: boolean
}

export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// Short random suffix that keeps room IDs unique across projects with the same name.
export function generateIdSuffix(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 6)
}

// The project ID doubles as the Liveblocks room ID.
export function buildRoomId(slug: string, suffix: string): string {
  return `${slug}-${suffix}`
}
