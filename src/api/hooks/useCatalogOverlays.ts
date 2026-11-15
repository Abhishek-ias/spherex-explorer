import { useMutation } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { components } from '@/api/schema'

type OverlayRequest = components['schemas']['OverlayRequest']
// Additive request field documented in the backend teammate's v2.1 sample.
type BackendV21OverlayRequest = OverlayRequest & { include_wise_image_layer: true }

export function useCatalogOverlays() {
  return useMutation({
    mutationFn: async (body: BackendV21OverlayRequest) => {
      const { data, error, response } = await api.POST('/api/overlays', { body })

      if (!response.ok || error || !data) {
        throw new Error(`Catalogue overlays unavailable (${response.status})`)
      }

      return data
    },
  })
}