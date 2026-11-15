import { API_BASE_URL } from './baseUrl'

/**
 * Resolve backend-returned resource paths against the configured API origin.
 * FastAPI image resources commonly arrive as /api/preview or /api/cache paths.
 */
export function resolveApiAssetUrl(
  resourceUrl: string,
  apiBaseUrl = API_BASE_URL,
): string {
  if (!resourceUrl.trim()) {
    throw new Error('Cannot resolve an empty API resource URL.')
  }

  const baseUrl = new URL(
    apiBaseUrl,
    typeof window === 'undefined' ? 'http://localhost' : window.location.origin,
  )
  const resolved = new URL(resourceUrl, baseUrl)

  if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
    throw new Error('API resource URLs must use HTTP or HTTPS.')
  }

  return resolved.toString()
}
