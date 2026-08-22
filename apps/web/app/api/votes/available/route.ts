import {
  callApiRpc,
  domainErrorResponse,
  getAuthenticatedClient,
  type JsonRecord,
  signAssetPaths,
} from "@/lib/server/domain-api"

export async function GET() {
  try {
    const client = await getAuthenticatedClient()
    const tests = await callApiRpc<JsonRecord[]>(client, "list_available_tests")
    const data = await Promise.all(
      tests.map((test) => signAssetPaths(client, test))
    )

    return Response.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    return domainErrorResponse(error)
  }
}
