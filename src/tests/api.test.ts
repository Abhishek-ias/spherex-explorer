
import { describe, expect, it } from 'vitest'
import { api } from '@/api/client'

describe('SPHEREx API integration', () => {
  it('returns all five backend-provided preset target records', async () => {
    const { data, error, response } = await api.GET('/api/targets')

    expect(response.status).toBe(200)
    expect(error).toBeUndefined()
    expect(data).toHaveLength(5)
    expect(data?.map((target) => target.id)).toEqual([
      'wise-0855',
      'barnards-star',
      'eps-indi-b',
      'rw-aur',
      'r-dra',
    ])
    expect(data?.[0]).toMatchObject({
      name: 'WISE 0855-0714',
      ra_deg: 133.795129,
      dec_deg: -7.245147,
    })
  })

  it('returns the two verified WISE 0855 SPHEREx DR1 observation frames', async () => {
    const { data, error, response } = await api.POST('/api/search', {
      body: { ra: 133.795129, dec: -7.245147, fov_arcmin: 15 },
    })

    expect(response.status).toBe(200)
    expect(error).toBeUndefined()
    expect(data?.total_observations).toBe(2)
    expect(data?.detectors).toEqual(['6'])
    expect(data?.epochs).toHaveLength(1)
    expect(data?.epochs[0]?.observations.map((frame) => frame.obs_id)).toEqual([
      '2025W19_1B_0116_2D6',
      '2025W19_1B_0138_1D6',
    ])
    expect(data?.epochs[0]?.observations[0]).toMatchObject({
      mjd: 60803.509722,
      date_iso: '2025-05-08T12:14:00.000',
      em_min_um: 4.41,
      em_max_um: 5.01,
      target_px: { x: 72.5, y: 72.5 },
      comparable_with: ['2025W19_1B_0138_1D6'],
    })
  })

  it('does not invent observation frames for preset targets without exported fixtures', async () => {
    const { data, response } = await api.POST('/api/search', {
      body: { ra: 269.452075, dec: 4.693364, fov_arcmin: 15 },
    })

    expect(response.status).toBe(503)
    expect(data).toBeUndefined()
  })

  it('returns a typed mock backend health response', async () => {
    const { data, error, response } = await api.GET('/api/health')

    expect(response.status).toBe(200)
    expect(error).toBeUndefined()
    expect(data).toEqual({
      status: 'mock',
      service: 'spherex-explorer',
      version: '2.0.0',
    })
  })

  it('returns a typed DEMO DATA search response', async () => {
    const { data, error, response } = await api.POST('/api/search', {
      body: {
        ra: 133.795129,
        dec: -7.245147,
        fov_arcmin: 15,
      },
    })

    expect(response.status).toBe(200)
    expect(error).toBeUndefined()

    expect(data).toMatchObject({
      query_ra_deg: 133.795129,
      query_dec_deg: -7.245147,
      fov_arcmin: 15,
      total_observations: 0,
      epochs: [],
    })
  })
})
