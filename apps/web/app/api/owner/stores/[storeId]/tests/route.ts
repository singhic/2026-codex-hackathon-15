import {
  callApiRpc,
  domainErrorResponse,
  getAuthenticatedClient,
  readJson,
  requiredInteger,
  requiredIsoDate,
  requiredString,
  uuidPath,
} from "@/lib/server/domain-api"

type RouteProps = { params: Promise<{ storeId: string }> }

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const { storeId: rawStoreId } = await params
    const storeId = uuidPath(rawStoreId)
    const client = await getAuthenticatedClient()
    const data = await callApiRpc(client, "get_owner_dashboard", {
      p_store_id: storeId,
    })
    return Response.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    return domainErrorResponse(error)
  }
}

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const { storeId: rawStoreId } = await params
    const storeId = uuidPath(rawStoreId)
    const body = await readJson(request)
    const client = await getAuthenticatedClient()
    const data = await callApiRpc(client, "create_test_draft", {
      p_store_id: storeId,
      p_title: requiredString(body, "title", 1, 120),
      p_question: requiredString(body, "question", 1, 300),
      p_starts_at: requiredIsoDate(body, "startsAt"),
      p_ends_at: requiredIsoDate(body, "endsAt"),
      p_target_votes: requiredInteger(body, "targetVotes", [30, 50, 70, 100]),
      p_reward_points: requiredInteger(
        body,
        "rewardPoints",
        Array.from({ length: 31 }, (_, index) => index)
      ),
    })
    return Response.json(data, { status: 201 })
  } catch (error) {
    return domainErrorResponse(error)
  }
}
