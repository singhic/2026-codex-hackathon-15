import {
  callApiRpc,
  domainErrorResponse,
  getAuthenticatedClient,
  readJson,
  requiredUuid,
  signAssetPaths,
} from "@/lib/server/domain-api"

type RouteProps = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const { slug } = await params
    const client = await getAuthenticatedClient()
    const context = await callApiRpc<Record<string, unknown>>(
      client,
      "get_vote_context",
      { p_slug: slug }
    )
    const data = await signAssetPaths(client, context)
    return Response.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    return domainErrorResponse(error)
  }
}

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const { slug } = await params
    const body = await readJson(request)
    const client = await getAuthenticatedClient()
    const data = await callApiRpc(client, "submit_vote", {
      p_slug: slug,
      p_option_id: requiredUuid(body, "optionId"),
      p_idempotency_key: requiredUuid(body, "idempotencyKey"),
    })
    return Response.json(data, { status: 201 })
  } catch (error) {
    return domainErrorResponse(error)
  }
}
