// A starter template picked in the create-project dialog is handed to the new
// project's canvas through sessionStorage, keyed by room ID. The canvas takes
// it (reads and removes it) once on first load. Storage can be unavailable, so
// every access is guarded and failure just means a blank canvas.
const keyFor = (roomId: string) => `ghost-ai:pending-template:${roomId}`

export function setPendingTemplate(roomId: string, templateId: string) {
  try {
    sessionStorage.setItem(keyFor(roomId), templateId)
  } catch {
    // Ignore: the project simply starts blank.
  }
}

export function takePendingTemplate(roomId: string): string | null {
  try {
    const id = sessionStorage.getItem(keyFor(roomId))
    sessionStorage.removeItem(keyFor(roomId))
    return id
  } catch {
    return null
  }
}
