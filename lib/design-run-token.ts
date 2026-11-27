import { auth } from "@trigger.dev/sdk"

// How long the browser may keep watching a run: the task can wait in the queue
// and then run for up to 10 minutes.
const RUN_TOKEN_LIFETIME = "30m"

// A public token that can only read one run, so the browser can follow it in
// real time without ever seeing the secret key. Server only.
export function createRunToken(runId: string, lifetime = RUN_TOKEN_LIFETIME): Promise<string> {
  return auth.createPublicToken({
    scopes: { read: { runs: [runId] } },
    expirationTime: lifetime,
  })
}
