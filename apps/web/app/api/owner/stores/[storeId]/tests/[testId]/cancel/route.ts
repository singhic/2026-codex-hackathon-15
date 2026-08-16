import {
  callApiRpc,
  domainErrorResponse,
  getAuthenticatedClient,
  readJson,
  requiredUuid,
  requireTestInStore,
  uuidPath,
} from "@/lib/server/domain-api"

type RouteProps = { params: Promise<{ storeId: string; testId: string }> }

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const path = await params
    const storeId = uuidPath(path.storeId)
    const testId = uuidPath(path.testId)
    const body = await readJson(request)
    const client = await getAuthenticatedClient()
    await requireTestInStore(client, storeId, testId)
    const data = await callApiRpc(client, "cancel_scheduled_test", {
      p_test_id: testId,
      p_idempotency_key: requiredUuid(body, "idempotencyKey"),
    })
    return Response.json(data)
  } catch (error) {
    return domainErrorResponse(error)
  }
}
