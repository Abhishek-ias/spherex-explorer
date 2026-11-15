import { describe, expect, it } from 'vitest'
import { parseDifferenceJobResult } from './differenceJobResult'

const response = {
  diff_key: 'demo-diff',
  difference_png_url: 'https://example.test/difference.png',
  significance_png_url: 'https://example.test/significance.png',
  early_wavelength_um: 4.8604,
  late_wavelength_um: 4.8619,
  photometric_scale_factor: 1.0124,
  wavelength_compatible: true,
  scientific_warning: null,
  display_scale: {
    vmin: -0.85,
    vmax: 0.85,
    unit: 'MJy/sr',
    stretch: 'linear',
    colormap: 'coolwarm',
  },
  early_date: '2025-01-01T00:00:00Z',
  late_date: '2025-01-02T00:00:00Z',
  shape_ny_nx: [128, 128],
  target_px: { x: 64, y: 64 },
  comparable_with: ['obs-2'],
  candidates: [],
}

describe('parseDifferenceJobResult', () => {
  it('accepts a result that matches the generated DifferenceResponse shape', () => {
    expect(parseDifferenceJobResult(response)).toEqual(response)
  })

  it('preserves the optional backend significance map resource', () => {
    expect(parseDifferenceJobResult(response)?.significance_png_url).toBe(
      'https://example.test/significance.png',
    )
  })

  it('preserves the optional v2.1 difference science metadata', () => {
    expect(parseDifferenceJobResult(response)).toMatchObject({
      early_wavelength_um: 4.8604,
      late_wavelength_um: 4.8619,
      photometric_scale_factor: 1.0124,
      wavelength_compatible: true,
      scientific_warning: null,
      display_scale: {
        vmin: -0.85,
        vmax: 0.85,
        unit: 'MJy/sr',
        stretch: 'linear',
        colormap: 'coolwarm',
      },
    })
  })

  it('preserves cross-match status supplied with a difference candidate', () => {
    const candidateResponse = {
      ...response,
      candidates: [{
        candidate_id: 'CAND-01',
        residual_type: 'positive_later_brighter',
        ra_deg: 133.79311,
        dec_deg: -7.24519,
        png_x: 73.68,
        png_y: 72.52,
        target_px: { x: 73.68, y: 72.52 },
        peak_residual_mjy_sr: 0.9142,
        significance_sigma: 6.45,
        match: {
          matched: true,
          match_type: 'moving_dipole_pair',
          gaia_source_id: null,
          discovery_status: 'unmatched_candidate_requires_verification',
        },
      }],
    }
    expect(parseDifferenceJobResult(candidateResponse)?.candidates[0]?.match).toMatchObject({
      gaia_source_id: null,
      discovery_status: 'unmatched_candidate_requires_verification',
    })
  })

  it('accepts legacy v2.0 results without a significance map', () => {
    const legacy: Record<string, unknown> = { ...response }
    delete legacy.significance_png_url
    expect(parseDifferenceJobResult(legacy)).not.toBeNull()
  })

  it('rejects a completed job whose result does not match DifferenceResponse', () => {
    expect(parseDifferenceJobResult({ status: 'completed' })).toBeNull()
    expect(parseDifferenceJobResult(null)).toBeNull()
  })
})
