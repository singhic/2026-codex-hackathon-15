import {
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
    const progress = await requireTestInStore(client, storeId, testId)
    const data = await signAssetPaths(client, progress)
    return Response.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    return domainErrorResponse(error)
  }
}
