import { randomUUID } from "node:crypto"

import { prisma } from "./prisma"
import { deleteSpecBlobs, saveSpecBlob } from "./spec-storage"

// Saves a generated spec: the Markdown goes to Vercel Blob and a `ProjectSpec` row
// (metadata only) links the blob URL to the project. Returns the new spec ID.
// If the row cannot be written, the blob is removed so nothing is left behind.
export async function persistSpec(projectId: string, markdown: string): Promise<string> {
  const specId = randomUUID()
  const filePath = await saveSpecBlob(projectId, specId, markdown)

  try {
    await prisma.projectSpec.create({ data: { id: specId, projectId, filePath } })
  } catch (error) {
    await deleteSpecBlobs([filePath])
    throw error
  }
  return specId
}
