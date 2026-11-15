import { describe, expect, it } from 'vitest'
import type { components } from '@/api/schema'
import {
  filterTimelineByBand,
  getWavelengthBandOptions,
} from './timelineUtils'

type ObservationFrame = components['schemas']['ObservationFrame']

function entry(
  obsId: string,
  minUm: number,
  maxUm: number,
  mjd: number,
): { epochId: string; frame: ObservationFrame } {
  return {
    epochId: 'epoch-1',
    frame: {
      obs_id: obsId,
      detector: 'DET-1',
      mjd,
      date_iso: '2025-01-01T00:00:00Z',
      em_min_um: minUm,
      em_max_um: maxUm,
      release: 'test',
      full_fits_url: 'https://example.test/full.fits',
      cutout_fits_url: 'https://example.test/cutout.fits',
      preview_png_url: 'https://example.test/preview.png',
      target_px: { x: 0, y: 0 },
      comparable_with: [],
    },
  }
}

describe('timeline wavelength bands', () => {
  const entries = [
    entry('frame-b', 1.2, 1.8, 2),
    entry('frame-a', 0.7, 1.1, 1),
    entry('frame-c', 0.7, 1.1, 3),
  ]

  it('returns unique bands ordered by wavelength', () => {
    expect(getWavelengthBandOptions(entries).map((band) => band.label)).toEqual([
      '0.700–1.100 μm',
      '1.200–1.800 μm',
    ])
  })

  it('keeps only frames within the selected band', () => {
    expect(filterTimelineByBand(entries, '0.7:1.1').map(({ frame }) => frame.obs_id))
      .toEqual(['frame-a', 'frame-c'])
  })

  it('returns all frames for the all-bands option', () => {
    expect(filterTimelineByBand(entries, 'all')).toHaveLength(3)
  })
})
