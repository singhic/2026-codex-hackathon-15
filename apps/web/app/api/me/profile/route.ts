import {
  callApiRpc,
  DomainError,
  domainErrorResponse,
  getAuthenticatedClient,
  readJson,
  requiredString,
} from "@/lib/server/domain-api"

const AGE_BANDS = new Set([
  "teens",
  "twenties",
  "thirties",
  "forties",
  "fifties",
  "sixties_plus",
])

export async function GET() {
  try {
    const client = await getAuthenticatedClient()
    const data = await callApiRpc(client, "get_my_profile")
    return Response.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    return domainErrorResponse(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await readJson(request)
    const ageBand = body.ageBand
    if (ageBand !== null && ageBand !== undefined) {
      if (typeof ageBand !== "string" || !AGE_BANDS.has(ageBand)) {
        throw new DomainError("VALIDATION_FAILED")
      }
    }

    const interests = body.interestCategoryIds ?? []
    if (
      !Array.isArray(interests) ||
      interests.some((value) => !Number.isInteger(value))
    ) {
      throw new DomainError("VALIDATION_FAILED")
    }

    const regionCode = body.regionCode
    if (
      regionCode !== null &&
      regionCode !== undefined &&
      (typeof regionCode !== "string" || regionCode.length > 20)
    ) {
      throw new DomainError("VALIDATION_FAILED")
    }

    const client = await getAuthenticatedClient()
    const data = await callApiRpc(client, "update_my_profile", {
      p_display_name: requiredString(body, "displayName", 1, 80),
      p_region_code: regionCode ?? null,
      p_age_band: ageBand ?? null,
      p_interest_category_ids: interests,
    })
    return Response.json(data)
  } catch (error) {
    return domainErrorResponse(error)
  }
}
