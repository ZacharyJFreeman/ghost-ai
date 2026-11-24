Wire up the AI sidebar so users can submit design prompts, track AI run status
in real time, and reflect AI-driven canvas updates through Liveblocks.

### Implementation

1. Submit from AI sidebar

- On submit:
  - push the user message to the `ai-chat` feed
  - call `POST /api/ai/design` with `{ prompt, roomId }`
  - read `{ runId, publicToken }` from the response
- store `runId` and `publicToken` in local state

2. Run status tracking

- Use `useRealtimeRun(runId, { accessToken: publicToken })`
- While the run is active:
  - disable the chat input
  - show a loading state (spinner in the button is enough)
- When the run completes:
  - push a final AI message to `ai-chat`
  - reset loading + run state

3. Canvas updates (realtime)

## Decisions Made

These settle conflicts with the earlier units while implementing. They are not from the video, so change them here if the video says otherwise.

- Step 3 had no details. Nothing was added for it: the task changes the canvas through Liveblocks storage, so every participant’s canvas already updates live.
- Response: `POST /api/ai/design` now returns `{ runId, publicToken }` (before it returned only `{ runId }`). The token is scoped to that one run and lasts 30 minutes. `POST /api/ai/design/token` stays.
- Request: the sidebar sends `{ prompt, roomId, projectId }`, with `projectId` equal to `roomId`, because the route from the earlier unit requires both.
- Order: the user message goes to `ai-chat` first; if that fails, nothing else happens and the draft stays. If the run cannot start after the message was sent, a small error shows and the draft is put back.
- Active run: the input stays disabled while the run this browser started is active or while the AI’s shared presence says it is working. Either one is enough.
- Final message: when the run ends, the browser that started it posts the AI’s summary to `ai-chat` as Ghost AI (or a short failure line if the run failed). Other participants’ browsers do not follow the run, so if the starter closes the tab mid-run, that message is never posted.
- Lost connection: if the run cannot be followed (error, or no end within 12 minutes), tracking stops, a small error shows, and no failure message is posted, because the outcome is unknown.
