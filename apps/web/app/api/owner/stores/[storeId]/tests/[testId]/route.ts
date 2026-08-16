import {
  callApiRpc,
  domainErrorResponse,
  getAuthenticatedClient,
  readJson,
  requiredInteger,
  requiredIsoDate,
  requiredString,
  requireTestInStore,
  uuidPath,
} from "@/lib/server/domain-api"

type RouteProps = {
  params: Promise<{ storeId: string; testId: string }>
}

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    const path = await params
    const storeId = uuidPath(path.storeId)
    const testId = uuidPath(path.testId)
    const body = await readJson(request)
    const client = await getAuthenticatedClient()
    await requireTestInStore(client, storeId, testId)
    const data = await callApiRpc(client, "update_test_draft", {
      p_test_id: testId,
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
    return Response.json(data)
  } catch (error) {
    return domainErrorResponse(error)
  }
}
