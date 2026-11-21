// Fixed palette of vivid colors that read well on the dark canvas. These are
// the text colors of the node palette in ui-context.md (neutral excluded).
export const CURSOR_COLORS = [
  "#52A8FF", // blue
  "#BF7AF0", // purple
  "#FF990A", // orange
  "#FF6166", // red
  "#F75F8F", // pink
  "#62C073", // green
  "#0AC7B4", // teal
] as const

// Deterministically maps a user ID to a color: the same ID always gets the
// same color, on every device and session (FNV-1a hash of the ID).
export function getCursorColor(userId: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return CURSOR_COLORS[(hash >>> 0) % CURSOR_COLORS.length]
}
