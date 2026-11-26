# Architecture Context

## Stack

| Layer     | Technology               | Role                                                            |
| --------- | ------------------------ | --------------------------------------------------------------- |
| Framework | Next.js 16 + TypeScript  | Full-stack app with server/client boundaries                    |
| UI        | Tailwind + shadcn/ui     | Component composition and styling                               |
| Auth      | Clerk                    | User identity and route protection                              |
| Database  | Prisma + PostgreSQL      | Relational metadata: projects, collaborators, specs, task runs  |
| Canvas    | Liveblocks + React Flow  | Real-time collaborative canvas, presence, and cursors            |
| Background tasks | Trigger.dev       | Durable AI generation workflows                                 |
| Artifact storage | Vercel Blob       | Canvas snapshots and generated Markdown specs                   |
| [Layer]   | [Technology]             | [Role]                                                          |

## System Boundaries

- `app/api` — Authenticated request handlers: input validation, ownership checks, task triggering, and persistence.
- `trigger` — Long-running background jobs: AI design generation and spec generation.
- `lib` — Shared infrastructure: Prisma client, access control helpers, and utilities.
- `lib/client` — Client-side API wrappers (`fetch` calls to `app/api`) used by hooks. Client-safe only: no server imports (Prisma, Clerk server SDK).
- `types` — Shared TypeScript types and constants (e.g. `types/canvas.ts`: canvas node/edge types and the node color palette; `types/tasks.ts`: the AI status feed ID and payload validation; `types/chat.ts`: the room chat feed ID and message validation).
- `liveblocks.config.ts` (project root) — Global Liveblocks `Presence` and `UserMeta` types.
- `components` — UI composition: canvas surfaces, sidebars, dialogs, and interactive elements.
- `hooks` — Client-side React hooks that own UI state (e.g. project dialog, form, and loading state). No data access or business rules.
- `prisma` — Database schema and generated client output.
- `data` — Legacy local directory. Not used for new artifacts.

## Storage Model

- **Database**: metadata, ownership, relationships, and task run records.
- **Vercel Blob**: generated artifacts — canvas snapshots at `canvas/{projectId}.json` and specs at `specs/{projectId}/{specId}.md`.
- Project records, spec records, and task run records belong in PostgreSQL.
- Canvas content and Markdown output are stored in and retrieved from Vercel Blob.
- The blob URL is stored in the database (`canvasJsonPath`, `filePath`) as the reference to the artifact.

## Auth and Collaboration Model

- Every project has a single owner (Clerk user ID).
- Projects can include additional collaborators.
- Only authenticated users can access protected routes.
- Route protection is resource-based, not path-based: `proxy.ts` only runs `clerkMiddleware()` so `auth()` works. Every page and route handler that needs a signed-in user checks auth itself — pages redirect to `/sign-in`, API routes return `401`. A new page or route that needs auth must add its own check.
- Only the owner or a collaborator can mutate project resources. Rename, delete, invite, and remove are owner-only; collaborators can view the project and the collaborator list.
- Collaborators are stored by email in `ProjectCollaborator` and matched to the signed-in user's primary Clerk email, case-insensitively. There is no local user table; display name and avatar come from the Clerk Backend API and fall back to the email when no Clerk user exists.
- Workspace access (`/editor/[roomId]`) is checked server-side. Missing and unauthorized projects are indistinguishable and both show `AccessDenied`.
- The project ID is also the Liveblocks room ID. It is the slugified project name plus a short unique suffix, generated on the client and validated and uniqueness-checked by `POST /api/projects` (the schema's `cuid()` default applies when no ID is sent).
- Liveblocks room tokens are issued only after verifying project membership.

## AI Design Agent

- The `design-agent` Trigger.dev task (`src/trigger/design-agent.ts`, logic in `lib/design-agent.ts`) reads the room's flow, asks Gemini for structured actions, validates them (allowed shapes, node color palette, grid and spacing rules), and applies them one at a time with `mutateFlow` from `@liveblocks/react-flow/node`, so every change reaches all collaborators through the normal Liveblocks storage.
- The AI is a room participant (`userId` `ghost-ai`) set through the Liveblocks REST `setPresence` (cursor and `isThinking`, short TTL so it clears itself).
- Progress is a shared status feed: one Liveblocks feed per room, `ai-status-feed` (`AI_STATUS_FEED_ID` in `types/tasks.ts`). The task creates the feed if needed (a second create returns 409, which means it exists; writing to a missing feed fails) and appends a message `{ text }` at start, while processing, and on complete or error. Messages are stored, so a participant who joins mid-run still sees the latest one. There are no room events for status.
- The payload is validated at the boundary: `parseAiStatusPayload` (`types/tasks.ts`) accepts an object with an optional string `text` and returns `null` for anything else; the sidebar shows only a valid latest message.
- The workspace shares one room connection: `EditorRoom` (`LiveblocksProvider` and `RoomProvider`) wraps both the canvas and the AI sidebar in `workspace-shell.tsx`, keyed by project ID. `useAiStatus` (`hooks/use-ai-status.ts`) reads the shared state: working means the AI participant (`AI_USER_ID`, `ghost-ai`, in `types/tasks.ts`) has `isThinking` in presence (other participants are ignored, because any collaborator can set their own presence and must not be able to lock everyone's input), and the status text is the newest `ai-status-feed` message (pages come back newest first, so a page of one is enough). Live cursors show a spinner in the name badge while that participant is thinking.

## Design Run From The Sidebar

- Submitting a message in the AI sidebar (`ai-architect-tab.tsx`) first posts it to `ai-chat`, then calls `POST /api/ai/design` with `{ prompt, roomId, projectId }` (`startDesignRun` in `lib/client/design-api.ts`). The route returns `{ runId, publicToken }`; the token (`createRunToken`, `lib/design-run-token.ts`) can only read that run and lasts 30 minutes, so the browser never sees the secret key.
- `useDesignRun` (`hooks/use-design-run.ts`) holds the run ID and token. While a run is active, `DesignRunTracker` (`components/editor/design-run-tracker.tsx`, one instance per run, keyed by run ID) follows it with `useRealtimeRun` from `@trigger.dev/react-hooks`. When the run ends, the browser that started it posts the AI's summary to `ai-chat` as `ghost-ai`; a lost connection or no end within 12 minutes stops the tracking without posting anything.
- Only the browser that started the run follows it. Everyone else sees the shared AI presence, the status feed, and the chat. The canvas needs nothing extra: the task writes through Liveblocks storage.

## Spec Generation

- `POST /api/ai/spec` takes `{ roomId, chatHistory, nodes, edges }` (schema in `lib/spec-generation.ts`), checks project access from `roomId` (the room ID is the project ID; a client `projectId` is never read), triggers the `generate-spec` task, saves a `TaskRun`, and returns `{ runId }`. `POST /api/ai/spec/token` returns a public token that can read only that run (1 hour) after checking the `TaskRun` belongs to the user; it shares `runTokenResponse` with the design token route.
- The `generateSpec` task (`src/trigger/generate-spec.ts`) is a `schemaTask` (Zod validates the payload before it runs), asks Gemini (`lib/gemini.ts`, shared with the design task) for a Markdown spec built from the diagram and chat, publishes `status` in run metadata (`starting`, `generating`, `complete`, `error`), and returns `{ spec }`. Invalid input fails the run without calling the model; other failures retry once because the task writes nothing while it runs. No frontend uses it yet.
- Persistence: after generating, the task saves the Markdown to private Vercel Blob at `specs/{projectId}/{specId}.md` (`lib/spec-storage.ts`) and writes a `ProjectSpec` row (`lib/spec-persistence.ts`; `id`, `projectId`, `filePath` = blob URL, `createdAt`; metadata only, cascade delete with the project). `GET /api/projects/[projectId]/specs/[specId]/download` checks project access and that the spec belongs to the project, fetches the blob on the server and returns it as a Markdown attachment; the Blob URL is never sent to the client. Deleting a project also removes its spec blobs. A deployed Trigger.dev environment needs `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` besides the Gemini key.

## Room Chat

- Chat is its own Liveblocks feed per room, `ai-chat` (`AI_CHAT_FEED_ID` in `types/chat.ts`), never mixed with `ai-status-feed`: chat is what people said, status is what the AI is doing. Messages live only in the feed (no database or blob), so reloads and late joiners see the history.
- A message is `{ text, senderId, senderName }`; the time is the feed message's server-set `createdAt`. `parseChatMessagePayload` checks a message before it is shown (non-blank string text up to 2000 characters, non-blank sender fields). The sender fields are claims: any collaborator can write to the feed, so a payload can name someone else.
- Sending runs on the client: `sendChatMessage` (`lib/chat-feed.ts`) is wired to the Liveblocks hooks in `hooks/use-ai-chat.ts`. Writing to a missing feed fails with `FEED_NOT_FOUND`, so the first message creates the feed and retries once; `FEED_ALREADY_EXISTS` (two people at once) is ignored. A send while disconnected rejects after about 5 seconds.
- The newest 50 messages load first (the server returns at most 100 per page, newest first) and older pages load on request; live messages are merged in and the list is kept oldest to newest.

## Starter System Designs

- Prebuilt templates are static canvas snapshots stored in the codebase.
- Templates are loaded into the active Liveblocks room when a user imports one.
- Import can occur on canvas creation or from within the editor at any time.

## Canvas Schema Notes

- Node data is `{ label, color, shape }`. Edges have no `type` and carry only an optional `data.label` (the text box over a line, saved and synced with the edge). Arrowheads come from React Flow `defaultEdgeOptions` at render time and are not stored.
- Selection, dragging, measured size, pan mode, the clipboard, and edit requests are local to each browser and are never synced or saved.

## Invariants

1. Request handlers do not run long-lived AI work — that belongs in background tasks.
2. Metadata and large generated artifacts are stored in separate layers.
3. Auth and ownership are enforced at every mutation boundary.
4. Client components are used only where browser interactivity or real-time state requires them.
5. The canvas schema must remain consistent between user-created content and imported templates.
