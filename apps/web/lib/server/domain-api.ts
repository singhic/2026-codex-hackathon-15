import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

export type JsonRecord = Record<string, unknown>

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const DOMAIN_STATUS: Record<string, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  OWN_STORE_TEST: 403,
  CONSENT_REQUIRED: 403,
  NOT_FOUND: 404,
  ASSET_NOT_AVAILABLE: 404,
  ALREADY_VOTED: 409,
  IDEMPOTENCY_CONFLICT: 409,
  INVALID_TEST_STATE: 409,
  RESULT_NOT_AVAILABLE: 409,
  TEST_NOT_ACTIVE: 409,
  INSUFFICIENT_CREDIT: 422,
  INVALID_OPTION: 422,
  VALIDATION_FAILED: 422,
}

export class DomainError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, status = DOMAIN_STATUS[code] ?? 500) {
    super(code)
    this.name = "DomainError"
    this.code = code
    this.status = status
  }
}

export async function getAuthenticatedClient(): Promise<
  SupabaseClient<Database>
> {
  const client = await createClient()
  const { data, error } = await client.auth.getClaims()

  if (error || !data?.claims?.sub) {
    throw new DomainError("UNAUTHENTICATED")
  }

  return client
}

export async function callApiRpc<T = unknown>(
  client: SupabaseClient<Database>,
  name: keyof Database["api"]["Functions"],
  args: JsonRecord = {}
): Promise<T> {
  const { data, error } = await client.schema("api").rpc(name, args as never)

  if (error) {
    throw new DomainError(normalizeDomainCode(error.message))
  }

  if (data === null || data === undefined) {
    throw new DomainError("INTERNAL_ERROR")
  }

  if (
    isJsonRecord(data) &&
    data.ok === false &&
    typeof data.code === "string"
  ) {
    throw new DomainError(data.code)
  }

  return data as T
}

export async function requireTestInStore(
  client: SupabaseClient<Database>,
  storeId: string,
  testId: string
) {
  const progress = await callApiRpc<JsonRecord>(client, "get_test_progress", {
    p_test_id: testId,
  })

  if (progress.storeId !== storeId) {
    throw new DomainError("NOT_FOUND")
  }

  return progress
}

export async function signAssetPaths(
  client: SupabaseClient<Database>,
  payload: JsonRecord
) {
  if (!Array.isArray(payload.options)) {
    return payload
  }

  const options = await Promise.all(
    payload.options.map(async (value) => {
      if (!isJsonRecord(value) || typeof value.assetPath !== "string") {
        return value
      }

      const { data, error } = await client.storage
        .from("test-posters")
        .createSignedUrl(value.assetPath, 600)

      if (error) {
        throw new DomainError("ASSET_NOT_AVAILABLE", 404)
      }

      const { assetPath: _assetPath, ...safeOption } = value
      void _assetPath
      return { ...safeOption, assetUrl: data.signedUrl }
    })
  )

  return { ...payload, options }
}

export function parseJsonObject(value: unknown): JsonRecord {
  if (!isJsonRecord(value)) {
    throw new DomainError("VALIDATION_FAILED")
  }

  return value
}

export function requiredString(
  body: JsonRecord,
  key: string,
  minLength: number,
  maxLength: number
) {
  const value = body[key]
  if (typeof value !== "string") {
    throw new DomainError("VALIDATION_FAILED")
  }

  const trimmed = value.trim()
  if (trimmed.length < minLength || trimmed.length > maxLength) {
    throw new DomainError("VALIDATION_FAILED")
  }

  return trimmed
}

export function requiredUuid(body: JsonRecord, key: string) {
  const value = body[key]
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new DomainError("VALIDATION_FAILED")
  }
  return value
}

export function requiredInteger(
  body: JsonRecord,
  key: string,
  allowedValues?: readonly number[]
) {
  const value = body[key]
  if (!Number.isInteger(value)) {
    throw new DomainError("VALIDATION_FAILED")
  }
  const parsed = value as number
  if (allowedValues && !allowedValues.includes(parsed)) {
    throw new DomainError("VALIDATION_FAILED")
  }
  return parsed
}

export function requiredIsoDate(body: JsonRecord, key: string) {
  const value = body[key]
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new DomainError("VALIDATION_FAILED")
  }
  return new Date(value).toISOString()
}

export function uuidPath(value: string) {
  if (!UUID_PATTERN.test(value)) {
    throw new DomainError("NOT_FOUND")
  }
  return value
}

export function domainErrorResponse(error: unknown) {
  const domainError =
    error instanceof DomainError ? error : new DomainError("INTERNAL_ERROR")

  return Response.json(
    { error: { code: domainError.code } },
    {
      status: domainError.status,
      headers: { "Cache-Control": "private, no-store" },
    }
  )
}

export async function readJson(request: Request) {
  try {
    return parseJsonObject(await request.json())
  } catch (error) {
    if (error instanceof DomainError) throw error
    throw new DomainError("VALIDATION_FAILED")
  }
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeDomainCode(message: string) {
  const code = message.trim().split(/[\s:]/, 1)[0]
  return code && /^[A-Z][A-Z0-9_]+$/.test(code) ? code : "INTERNAL_ERROR"
}
