import { del, get, put } from "@vercel/blob"

// Server-only: generated specs live in the same private Vercel Blob store as the
// canvas, one blob per spec at `specs/{projectId}/{specId}.md`. Prisma keeps only
// the blob URL (`ProjectSpec.filePath`). The URL and token never reach the client:
// specs are downloaded through the download route, after an access check.

const specPath = (projectId: string, specId: string) => `specs/${projectId}/${specId}.md`

// Uploads the Markdown and returns the blob URL.
export async function saveSpecBlob(projectId: string, specId: string, markdown: string): Promise<string> {
  const blob = await put(specPath(projectId, specId), markdown, {
    access: "private",
    addRandomSuffix: false,
    contentType: "text/markdown; charset=utf-8",
  })
  return blob.url
}

// The spec's content as text, or null when the blob is missing or unreadable.
export async function readSpecBlob(url: string): Promise<string | null> {
  const result = await get(url, { access: "private", useCache: false })
  if (!result || result.statusCode !== 200) return null
  return new Response(result.stream).text()
}

// Best effort: a blob failure must never block the caller (cleanup after a failed save, project delete).
export async function deleteSpecBlobs(urls: string[]): Promise<void> {
  if (urls.length === 0) return
  try {
    await del(urls)
  } catch (error) {
    console.error("Failed to delete spec blobs", error)
  }
}
