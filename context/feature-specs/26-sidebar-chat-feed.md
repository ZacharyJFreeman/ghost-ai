Add real-time room chat to the AI sidebar using a separate Liveblocks `ai-chat` feed.

This is only for chat messages. Keep it separate from `ai-status-feed`, which handles AI progress and presence updates.

## Implementation

1. Add the `ai-chat` feed.

   Before implementing, check the existing Liveblocks setup and follow the same feed patterns already used in the project.
   - create or reuse a Liveblocks feed named `ai-chat`
   - keep it room-scoped
   - do not mix it with `ai-status-feed`

2. Wire the chat feed into the sidebar.
   - subscribe to `ai-chat` in the sidebar chat area
   - render chat messages in order
   - show sender, timestamp, and message content
   - keep the styling consistent with the existing sidebar UI
   - use Tailwind utilities and existing shadcn components where they fit

3. Add message sending.
   - allow users in the room to send messages to `ai-chat`
   - use the existing sidebar input and send button
   - clear the input after a successful send
   - show a small error state if sending fails

4. Add message validation.

## Recommended Scope Limits

These were added as recommendations next to the spec. Merge them with the spec's own limits, or replace them, when those are available.

- don’t trigger the design task or call any AI provider from the chat (sending only writes to `ai-chat`)
- don’t change `ai-status-feed` or the status row from the previous unit
- don’t add editing, deleting, reactions, or search
- don’t store messages anywhere except the `ai-chat` feed (no database or blob storage)

## Recommended Check When Done

- Two clients in the same room see each other’s messages in order, with sender and time.
- Messages are still there after a reload.
- A failed send keeps the draft in the input and shows a small error.
- A malformed message in `ai-chat` is not rendered.
- Status messages never appear in chat, and chat messages never appear in the status row.
- An empty feed shows an empty state.
- `npm run build` passes.

## Decisions Made

These settle the open points above. They were chosen while implementing, not taken from the video, so change them here if the video says otherwise.

- Step 4 (message validation) had no details. It was implemented like the status feed’s validation: the payload schema lives in `types/chat.ts` and a message is checked before it is shown.
- Sender: the sender name and ID are part of the payload (`{ text, senderId, senderName }`). They are claims, not proof: any collaborator can write to the feed, so a payload can name someone else. Accepted for now.
- Timestamp: the message’s server-set `createdAt`. Today’s messages show the time, older ones show the date and time.
- History: the newest 50 messages load first (the server allows at most 100 per page); a “Load earlier messages” button loads older pages.
- Existing sidebar chat: the welcome message stays as a local greeting (not stored), shown at the top once there are no older messages to load. The starter chips stay and show only while the chat is empty.
- AI working state: unchanged from the previous unit. The input stays disabled while the AI works, so room chat is also paused during a run.
- Message limits: whitespace-only messages are not sent, and a message is at most 2000 characters (the input stops at the limit and the validator rejects longer ones).
- Feed creation: writing to a missing feed fails with `FEED_NOT_FOUND`, so the first message creates the feed and tries again. If someone else creates it at the same moment (`FEED_ALREADY_EXISTS`), that is ignored.
- Failed send: the draft stays in the input and a small error shows above it until the user edits the text or tries again.
