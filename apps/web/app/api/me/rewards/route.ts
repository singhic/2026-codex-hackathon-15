import {
  callApiRpc,
  domainErrorResponse,
  getAuthenticatedClient,
} from "@/lib/server/domain-api"

export async function GET() {
  try {
    const client = await getAuthenticatedClient()
    const data = await callApiRpc(client, "get_reward_wallet")
    return Response.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    return domainErrorResponse(error)
  }
}
