import {
  callApiRpc,
  DomainError,
  domainErrorResponse,
  getAuthenticatedClient,
  readJson,
  requiredString,
  requireTestInStore,
  uuidPath,
} from "@/lib/server/domain-api"

type RouteProps = {
  params: Promise<{ storeId: string; testId: string; optionId: string }>
}

const EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"])

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const path = await params
    const storeId = uuidPath(path.storeId)
    const testId = uuidPath(path.testId)
    const optionId = uuidPath(path.optionId)
    const body = await readJson(request)
    const extension = requiredString(body, "extension", 3, 4).toLowerCase()
    if (!EXTENSIONS.has(extension)) throw new DomainError("VALIDATION_FAILED")

    const client = await getAuthenticatedClient()
    await requireTestInStore(client, storeId, testId)
    const { data } = await client.auth.getClaims()
    const userId = data?.claims?.sub
    if (typeof userId !== "string") throw new DomainError("UNAUTHENTICATED")

    return Response.json({
      assetPath: `${userId}/${storeId}/${testId}/${optionId}/${crypto.randomUUID()}.${extension}`,
    })
  } catch (error) {
    return domainErrorResponse(error)
  }
}

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    const path = await params
    const storeId = uuidPath(path.storeId)
    const testId = uuidPath(path.testId)
    const optionId = uuidPath(path.optionId)
    const body = await readJson(request)
    const client = await getAuthenticatedClient()
    await requireTestInStore(client, storeId, testId)
    const data = await callApiRpc(client, "set_test_option_asset", {
      p_test_id: testId,
      p_option_id: optionId,
      p_asset_path: requiredString(body, "assetPath", 10, 500),
    })
    return Response.json(data)
  } catch (error) {
    return domainErrorResponse(error)
  }
}
