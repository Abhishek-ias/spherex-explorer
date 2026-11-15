import { useMutation, useQuery } from '@tanstack/react-query'
import { apiV21Share } from '@/api/v21ShareClient'
import type {
  InvestigationShareRequest,
  InvestigationShareResponse,
} from '@/api/v21ShareTypes'

export function useCreateInvestigationShare() {
  return useMutation({
    mutationFn: async (body: InvestigationShareRequest) => {
      const { data, error, response } = await apiV21Share.POST('/api/share', { body })
      if (!response.ok || error || !data) {
        throw new Error(`Backend investigation save failed (${response.status})`)
      }
      return data
    },
  })
}

export function useRestoreInvestigationShare(
  shareId: string | null,
  enabled: boolean,
) {
  return useQuery<InvestigationShareResponse>({
    queryKey: ['backend-investigation-share', shareId],
    enabled: Boolean(shareId) && enabled,
    queryFn: async ({ signal }) => {
      if (!shareId) throw new Error('A server share ID is required.')
      const { data, error, response } = await apiV21Share.GET(
        '/api/share/{share_id}',
        { params: { path: { share_id: shareId } }, signal },
      )
      if (!response.ok || error || !data) {
        throw new Error(`Backend investigation restore failed (${response.status})`)
      }
      return data
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
