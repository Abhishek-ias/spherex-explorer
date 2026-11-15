import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'

export function useApiHealth() {
  return useQuery({
    queryKey: ['api', 'health'],
    queryFn: async ({ signal }) => {
      const { data, error, response } = await api.GET('/api/health', { signal })

      if (!response.ok || error || !data) {
        throw new Error(`Backend health check failed (${response.status})`)
      }

      return data
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: 1,
  })
}
