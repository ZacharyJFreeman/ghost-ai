import { runTokenResponse } from "@/lib/run-token-response"

// Spec runs can be followed for an hour.
export async function POST(request: Request) {
  return runTokenResponse(request, "1h")
}
