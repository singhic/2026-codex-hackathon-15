export const DEFAULT_POST_LOGIN_PATH = "/"

export function getSafeNextPath(
  value: string | null | undefined,
  fallback = DEFAULT_POST_LOGIN_PATH
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback
  }

  return value
}
