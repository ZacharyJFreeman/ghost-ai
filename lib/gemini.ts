// Shared Gemini settings for the background AI tasks (design and spec generation).
// Relative imports only elsewhere in the task code: the Trigger.dev bundler does not
// resolve the `@/` alias.

export const GEMINI_MODEL = "gemini-3.5-flash"

// The spec for the design agent names GEMINI_API_KEY; only GOOGLE_AI_API_KEY is set
// in .env.local, so both are accepted.
export function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY
  if (!key) throw new Error("GEMINI_API_KEY is not set")
  return key
}
