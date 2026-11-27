import { runTokenResponse } from "@/lib/run-token-response"

export async function POST(request: Request) {
  return runTokenResponse(request)
}
