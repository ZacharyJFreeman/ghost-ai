import { createGoogle } from "@ai-sdk/google";
import { logger, metadata, schemaTask } from "@trigger.dev/sdk";
import { generateText } from "ai";

import { GEMINI_MODEL, getGeminiApiKey } from "../../lib/gemini";
import { buildSpecPrompt, SPEC_SYSTEM_PROMPT, specTaskPayloadSchema } from "../../lib/spec-generation";
import { persistSpec } from "../../lib/spec-persistence";

const MODEL_TIMEOUT_MS = 120_000;

// Run metadata is what a browser following the run reads for progress.
type SpecStatus = "starting" | "generating" | "saving" | "complete" | "error";

function setStatus(status: SpecStatus) {
  metadata.set("status", status);
}

// `schemaTask` validates the payload with Zod before `run` starts, so `run` only
// ever sees valid input and a bad payload fails the run without calling the model.
export const generateSpec = schemaTask({
  id: "generate-spec",
  schema: specTaskPayloadSchema,
  maxDuration: 300,
  // Unlike the design task, nothing is written anywhere while it runs, so a retry
  // is safe and covers a flaky model call.
  retry: { maxAttempts: 2, minTimeoutInMs: 1000, maxTimeoutInMs: 10_000, factor: 2 },
  run: async (payload, { ctx }) => {
    setStatus("starting");
    logger.log("generate-spec: started", {
      runId: ctx.run.id,
      projectId: payload.projectId,
      nodes: payload.nodes.length,
      edges: payload.edges.length,
      chatMessages: payload.chatHistory.length,
    });

    try {
      setStatus("generating");
      const google = createGoogle({ apiKey: getGeminiApiKey() });
      const { text } = await generateText({
        model: google(GEMINI_MODEL),
        system: SPEC_SYSTEM_PROMPT,
        prompt: buildSpecPrompt(payload),
        abortSignal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
      });

      const spec = text.trim();
      if (!spec) throw new Error("The model returned an empty spec");

      // Keep the Markdown in Vercel Blob and its metadata in Prisma.
      setStatus("saving");
      const specId = await persistSpec(payload.projectId, spec);

      setStatus("complete");
      return { spec, specId };
    } catch (error) {
      setStatus("error");
      logger.error("generate-spec failed", { error: error instanceof Error ? error.message : String(error) });
      // Rethrown as is so the retry setting applies.
      throw error;
    }
  },
});
