import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { API_BASE_URL } from '@/api/baseUrl'
import { apiV21Share } from './v21ShareClient'
import type { InvestigationShareRequest } from './v21ShareTypes'
import { server } from '@/mocks/server'

const requestBody: InvestigationShareRequest = {
  ra: 133.795129,
  dec: -7.245147,
  fov_arcmin: 15,
  detector: '6',
  earlier_epoch: '2025-S1',
  later_epoch: '2026-S1',
  selected_object_ra: 133.79458,
  selected_object_dec: -7.24542,
  active_view: 'isolation',
  overlays_enabled: ['gaia_dr3', 'wise'],
}

describe('v2.1 backend investigation share client', () => {
  it('creates a backend-persisted investigation and returns its share URL', async () => {
    server.use(
      http.post(`${API_BASE_URL}/api/share`, async ({ request }) => {
        expect(await request.json()).toEqual(requestBody)
        return HttpResponse.json({
          share_id: 'a91f4c82e0',
          share_query_string: '?share=a91f4c82e0&ra=08h55m10.831s&dec=-07d14m42.53s&fov=15.0',
          created_at: '2026-11-15T09:10:00Z',
          state: requestBody,
        })
      }),
    )

    const { data, error, response } = await apiV21Share.POST('/api/share', {
      body: requestBody,
    })

    expect(response.status).toBe(200)
    expect(error).toBeUndefined()
    expect(data).toMatchObject({
      share_id: 'a91f4c82e0',
      share_query_string: expect.stringContaining('share=a91f4c82e0'),
      state: requestBody,
    })
  })

  it('retrieves a backend-saved investigation by share ID', async () => {
    server.use(
      http.get(`${API_BASE_URL}/api/share/:share_id`, ({ params }) =>
        HttpResponse.json({
          share_id: String(params.share_id),
          share_query_string: '?share=a91f4c82e0&ra=133.795129&dec=-7.245147&fov=15',
          created_at: '2026-11-15T09:10:00Z',
          state: requestBody,
        }),
      ),
    )

    const { data, error, response } = await apiV21Share.GET(
      '/api/share/{share_id}',
      { params: { path: { share_id: 'a91f4c82e0' } } },
    )

    expect(response.status).toBe(200)
    expect(error).toBeUndefined()
    expect(data?.share_id).toBe('a91f4c82e0')
    expect(data?.state).toEqual(requestBody)
  })
})
