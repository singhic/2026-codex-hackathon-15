import {
  callApiRpc,
  DomainError,
  domainErrorResponse,
  getAuthenticatedClient,
  readJson,
} from "@/lib/server/domain-api"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET() {
  try {
    const client = await getAuthenticatedClient()
    const data = await callApiRpc(client, "get_current_legal_documents")
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
    const documentIds = body.documentIds
    if (
      !Array.isArray(documentIds) ||
      documentIds.length === 0 ||
      documentIds.some(
        (documentId) =>
          typeof documentId !== "string" || !UUID_PATTERN.test(documentId)
      )
    ) {
      throw new DomainError("VALIDATION_FAILED")
    }

    const client = await getAuthenticatedClient()
    const data = await callApiRpc(client, "accept_legal_documents", {
      p_document_ids: documentIds,
    })
    return Response.json(data)
  } catch (error) {
    return domainErrorResponse(error)
  }
}
