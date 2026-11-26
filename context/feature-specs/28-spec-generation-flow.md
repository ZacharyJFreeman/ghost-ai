Create the backend flow for AI-powered spec generation: API route, Trigger.dev task, token route, and run ownership tracking.

### Implementation

1. Spec trigger route

Create or update `POST /api/ai/spec`.

It should:

- accept `roomId`, `chatHistory`, `nodes`, and `edges`
- authenticate the current user
- resolve project access from `roomId`
- trigger the `generate-spec` task
- save a `TaskRun` record for ownership/access control
- return the Trigger.dev `runId`

Do not trust a client-supplied `projectId`.

2. Spec token route

Create or update `POST /api/ai/spec/token`.

It should:

- authenticate the current user
- verify the `TaskRun` belongs to the user
- issue a Trigger.dev public access token scoped to that run
- set token expiration to 1 hour
- return the token to the client

3. Spec generation task

Create or update `trigger/generate-spec.ts`.
Define a `generateSpec` task that:

- accepts `projectId`, `roomId`, `chatHistory`, `nodes`, and `edges`
- validates input with Zod
- uses Gemini through `@ai-sdk/google`
- generates a Markdown technical spec from the canvas and chat context
- updates run metadata/status for realtime tracking
- returns the generated spec content as task output

Follow the existing Trigger.dev task patterns in the codebase for retries, logging, and error handling.

### Scope Limits

- Do not add frontend logic
- Do not create spec editor UI

## Decisions Made

These settle gaps while implementing. They are not from the video, so change them here if the video says otherwise.

- Cut-off lines: one bullet of the token route (assumed: accept a `runId`), the third scope limit, and any Check When Done were not visible.
- Task path: the task is `src/trigger/generate-spec.ts` (tasks live in `src/trigger`), and it exports `generateSpec` with the task ID `generate-spec`.
- Zod: it was only a transitive dependency, so it was added as a direct one (`zod@^4.6.7`, the version already installed).
- Request shape (not defined in the spec): `chatHistory` is a list of `{ sender, text }` (up to 200, text up to 2000 characters); `nodes` are `{ id, data: { label, shape } }` (up to 500); `edges` are `{ id, source, target, data: { label } }` (up to 1000). Other fields are dropped. The schema is in `lib/spec-generation.ts` and is used by both the route and the task.
- Project ID: the route reads only `roomId` and uses it as the project ID after checking access; a client-sent `projectId` is dropped by the schema. The task still takes `projectId` in its payload, as the spec lists.
- Route response: only `{ runId }` (the token comes from the token route), as the spec says.
- Token: `POST /api/ai/spec/token` returns a token that can read only that run and lasts 1 hour. It shares its body with the design token route (`lib/run-token-response.ts`).
- Task: status goes to run metadata (`status`: `starting`, `generating`, `complete`, `error`); the output is `{ spec }` with the Markdown; it is a `schemaTask`, so Trigger.dev validates the payload with Zod before `run` starts and a bad payload fails the run (TASK_INPUT_ERROR) without calling the model; other failures retry once (`maxAttempts: 2`, 1 to 10 second backoff), because nothing is written anywhere while it runs.
- Output: Markdown with Overview, Architecture, Components, Data Flow, Technology Choices and Key Considerations, written as "Ghost AI, a senior technical architect" (persona and sections taken from the video's task code); components come only from the diagram and the chat, and technology choices are suggestions.
- Shared Gemini settings (`lib/gemini.ts`) are now used by both the design and the spec task.
