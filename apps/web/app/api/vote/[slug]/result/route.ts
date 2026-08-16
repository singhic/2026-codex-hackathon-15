import {
  callApiRpc,
  domainErrorResponse,
  getAuthenticatedClient,
  signAssetPaths,
} from "@/lib/server/domain-api"

type RouteProps = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const { slug } = await params
    const client = await getAuthenticatedClient()
    const result = await callApiRpc<Record<string, unknown>>(
      client,
      "get_public_result",
      { p_slug: slug }
    )
    const data = await signAssetPaths(client, result)
    return Response.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    return domainErrorResponse(error)
  }
}
