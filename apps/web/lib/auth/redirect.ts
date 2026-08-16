export const DEFAULT_POST_LOGIN_PATH = "/onboarding"

const ALLOWED_NEXT_PREFIXES = ["/owner", "/vote", "/me", "/onboarding"]

export function getSafeNextPath(
  value: string | null | undefined,
  fallback = DEFAULT_POST_LOGIN_PATH
) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    !ALLOWED_NEXT_PREFIXES.some(
      (prefix) => value === prefix || value.startsWith(`${prefix}/`)
    )
  ) {
    return fallback
  }

  return value
}
