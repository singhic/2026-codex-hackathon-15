import {
  callApiRpc,
  domainErrorResponse,
  getAuthenticatedClient,
  readJson,
  requiredInteger,
  requiredString,
} from "@/lib/server/domain-api"

export async function GET() {
  try {
    const client = await getAuthenticatedClient()
    const data = await callApiRpc(client, "get_my_stores")
    return Response.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    return domainErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request)
    const client = await getAuthenticatedClient()
    const data = await callApiRpc(client, "create_store", {
      p_name: requiredString(body, "name", 1, 100),
      p_category_id: requiredInteger(body, "categoryId"),
      p_region_code: requiredString(body, "regionCode", 2, 20),
      p_address: requiredString(body, "address", 2, 240),
    })

    return Response.json(data, { status: 201 })
  } catch (error) {
    return domainErrorResponse(error)
  }
}
