import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'

function readDetail(value: unknown): string | undefined {
  if (!value || typeof value !== 'object' || !('detail' in value)) return undefined
  const detail = (value as { detail?: unknown }).detail
  return typeof detail === 'string' ? detail : undefined
}

async function getErrorMessage(error: unknown, response: Response): Promise<string> {
  const typedDetail = readDetail(error)
  if (typedDetail) return typedDetail

  try {
    const payload: unknown = await response.clone().json()
    const responseDetail = readDetail(payload)
    if (responseDetail) return responseDetail
  } catch {
    // Non-JSON error responses fall back to their HTTP status.
  }

  return `Observation search failed (${response.status})`
}

export function useSearchObservations(
  ra: number | undefined,
  dec: number | undefined,
  fov: number | undefined,
) {
  return useQuery({
    queryKey: ['observations', ra, dec, fov],
    enabled: ra !== undefined && dec !== undefined && fov !== undefined,
    queryFn: async ({ signal }) => {
      const { data, error, response } = await api.POST('/api/search', {
        body: {
          ra: ra as number,
          dec: dec as number,
          fov_arcmin: fov as number,
        },
        signal,
      })

      if (!response.ok || error || !data) {
        throw new Error(await getErrorMessage(error, response))
      }

      return data
    },
    staleTime: 60_000,
  })
}
