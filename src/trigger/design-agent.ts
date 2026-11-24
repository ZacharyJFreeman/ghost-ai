import { createGoogle } from "@ai-sdk/google";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { AbortTaskRunError, logger, task } from "@trigger.dev/sdk";
import { generateText, jsonSchema, Output, type JSONSchema7 } from "ai";

import {
  buildPrompt,
  DESIGN_OUTPUT_SCHEMA,
  DESIGN_SYSTEM_PROMPT,
  planOperations,
  snapshotCanvas,
  type DesignOperation,
  type DesignOutput,
} from "../../lib/design-agent";
import { getLiveblocks } from "../../lib/liveblocks";
import type { CanvasEdge, CanvasNode } from "../../types/canvas";
import { AI_STATUS_FEED_ID, AI_USER_ID, AI_USER_NAME, type AiStatusPayload } from "../../types/tasks";

export type DesignAgentPayload = {
  prompt: string;
  roomId: string;
};

const DESIGN_MODEL = "gemini-3.5-flash";
const MODEL_TIMEOUT_MS = 120_000;

// The AI joins the room as its own participant (set through the Liveblocks
// REST API, so no websocket), using the accent-ai-text token color.
const AI_USER_INFO = { name: AI_USER_NAME, avatar: "", color: "#8b82ff" };
// Presence expires on its own, so a crashed task never leaves the AI stuck "thinking".
const PRESENCE_TTL_SECONDS = 120;
const CLEAR_PRESENCE_TTL_SECONDS = 2;
const STATUS_EVERY_N_OPERATIONS = 5;
const STEP_DELAY_MS = 250;

type Cursor = { x: number; y: number } | null;
type StatusKind = "start" | "processing" | "complete" | "error";

const outputSchema = jsonSchema<DesignOutput>(DESIGN_OUTPUT_SCHEMA as unknown as JSONSchema7, {
  validate: (value) => {
    if (
      value &&
      typeof value === "object" &&
      typeof (value as DesignOutput).summary === "string" &&
      Array.isArray((value as DesignOutput).actions)
    ) {
      return { success: true, value: value as DesignOutput };
    }
    return { success: false, error: new Error("Model output is missing summary or actions") };
  },
});

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return key;
}

// Presence and status are cosmetic: a failure is logged and never fails the task.
async function setAiPresence(roomId: string, cursor: Cursor, isThinking: boolean, ttl = PRESENCE_TTL_SECONDS) {
  try {
    await getLiveblocks().setPresence(roomId, {
      userId: AI_USER_ID,
      data: { cursor, isThinking },
      userInfo: AI_USER_INFO,
      ttl,
    });
  } catch (error) {
    logger.warn("design-agent: could not set AI presence", { error: String(error) });
  }
}

// The shared status feed is one Liveblocks feed per room. Creating it when it
// already exists returns 409, which just means it is there; writing to a feed that
// does not exist fails, so this runs once before the first status.
async function ensureStatusFeed(roomId: string) {
  try {
    await getLiveblocks().createFeed({ roomId, feedId: AI_STATUS_FEED_ID });
  } catch (error) {
    if ((error as { status?: number }).status === 409) return;
    logger.warn("design-agent: could not create the status feed", { error: String(error) });
  }
}

// Status goes to the room's feed, so every participant's sidebar shows the latest one.
async function publishStatus(roomId: string, runId: string, status: StatusKind, message: string) {
  logger.log(`design-agent: ${status}`, { runId, message });
  try {
    // `satisfies` keeps the literal's type, which Liveblocks accepts as JSON (an interface is not).
    const data = { text: message } satisfies AiStatusPayload;
    await getLiveblocks().createFeedMessage({ roomId, feedId: AI_STATUS_FEED_ID, data });
  } catch (error) {
    logger.warn("design-agent: could not publish status", { error: String(error) });
  }
}

async function applyOperation(roomId: string, operation: DesignOperation) {
  await mutateFlow<CanvasNode, CanvasEdge>({ client: getLiveblocks(), roomId }, (flow) => {
    switch (operation.kind) {
      case "add_node":
        flow.addNode(operation.node);
        break;
      case "move_node":
        flow.updateNode(operation.id, { position: operation.position });
        break;
      case "resize_node":
        flow.updateNode(operation.id, { width: operation.width, height: operation.height });
        break;
      case "update_node_data":
        flow.updateNodeData(operation.id, operation.data);
        break;
      case "delete_node": {
        // Deleting a shape breaks the lines attached to it (including any added since planning).
        const attached = flow.edges.filter((edge) => edge.source === operation.id || edge.target === operation.id);
        flow.removeEdges(attached.map((edge) => edge.id));
        flow.removeNode(operation.id);
        break;
      }
      case "add_edge":
        flow.addEdge(operation.edge);
        break;
      case "delete_edge":
        flow.removeEdge(operation.id);
        break;
    }
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runDesignAgent(payload: DesignAgentPayload, runId: string) {
  const { prompt, roomId } = payload;

  await ensureStatusFeed(roomId);
  await publishStatus(roomId, runId, "start", "Ghost AI is starting on your design");
  await setAiPresence(roomId, null, true);

  try {
    // 1. Read the current canvas so the model extends it instead of rebuilding it.
    let nodes: CanvasNode[] = [];
    let edges: CanvasEdge[] = [];
    await mutateFlow<CanvasNode, CanvasEdge>({ client: getLiveblocks(), roomId }, (flow) => {
      nodes = [...flow.nodes];
      edges = [...flow.edges];
    });

    // 2. Ask Gemini for structured canvas actions.
    await publishStatus(roomId, runId, "processing", "Thinking through the architecture");
    const google = createGoogle({ apiKey: getApiKey() });
    const { output } = await generateText({
      model: google(DESIGN_MODEL),
      system: DESIGN_SYSTEM_PROMPT,
      prompt: buildPrompt(prompt, snapshotCanvas(nodes, edges)),
      output: Output.object({ schema: outputSchema }),
      abortSignal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
    });

    // 3. Validate against the shape, palette, and layout rules.
    const { operations, skipped } = planOperations(output.actions, nodes, edges, runId.slice(-8));
    if (operations.length === 0) {
      await publishStatus(roomId, runId, "complete", output.summary || "No changes were needed");
      return { roomId, operations: 0, skipped, summary: output.summary };
    }

    // 4. Apply one operation at a time so everyone watches the design appear.
    let cursor: Cursor = null;
    for (const [index, operation] of operations.entries()) {
      cursor = operation.focus ?? cursor;
      await setAiPresence(roomId, cursor, true);
      if (index % STATUS_EVERY_N_OPERATIONS === 0) {
        await publishStatus(roomId, runId, "processing", `${operation.description} (${index + 1} of ${operations.length})`);
      }
      await applyOperation(roomId, operation);
      await sleep(STEP_DELAY_MS);
    }

    await publishStatus(roomId, runId, "complete", output.summary || "Design updated");
    return { roomId, operations: operations.length, skipped, summary: output.summary };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("design-agent failed", { error: message });
    // Say what failed without leaking internals (keys, stack traces) to the room.
    await publishStatus(roomId, runId, "error", "Ghost AI couldn't finish this design. Nothing else was changed.");
    throw new AbortTaskRunError(message);
  } finally {
    await setAiPresence(roomId, null, false, CLEAR_PRESENCE_TTL_SECONDS);
  }
}

export const designAgentTask = task({
  id: "design-agent",
  maxDuration: 600,
  // Operations are applied to the shared canvas as they go, so a retry would duplicate them.
  retry: { maxAttempts: 1 },
  run: async (payload: DesignAgentPayload, { ctx }) => runDesignAgent(payload, ctx.run.id),
});
