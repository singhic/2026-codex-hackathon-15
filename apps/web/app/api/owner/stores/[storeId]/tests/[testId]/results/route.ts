import {
  callApiRpc,
  domainErrorResponse,
  getAuthenticatedClient,
  requireTestInStore,
  signAssetPaths,
  uuidPath,
} from "@/lib/server/domain-api"

type RouteProps = { params: Promise<{ storeId: string; testId: string }> }

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const path = await params
    const storeId = uuidPath(path.storeId)
    const testId = uuidPath(path.testId)
    const client = await getAuthenticatedClient()
    await requireTestInStore(client, storeId, testId)
    const result = await callApiRpc<Record<string, unknown>>(
      client,
      "get_test_results",
      {
        p_test_id: testId,
      }
    )
    const data = await signAssetPaths(client, result)
    return Response.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    return domainErrorResponse(error)
  }
}
