import {
  callApiRpc,
  domainErrorResponse,
  getAuthenticatedClient,
} from "@/lib/server/domain-api"

type RouteProps = { params: Promise<{ slug: string }> }

export async function POST(_request: Request, { params }: RouteProps) {
  try {
    const { slug } = await params
    const client = await getAuthenticatedClient()
    const data = await callApiRpc(client, "record_test_detail_view", {
      p_slug: slug,
    })
    return Response.json(data)
  } catch (error) {
    return domainErrorResponse(error)
  }
}
