import { describe, expect, it } from 'vitest'
import { parseIsolationJobResult } from './isolationJobResult'

const measurement = {
  object_id: 'demo-source',
  ra_deg: 120,
  dec_deg: -20,
  ra_hms: '08:00:00',
  dec_dms: '-20:00:00',
  fits_x: 40,
  fits_y: 42,
  png_x: 40,
  png_y: 42,
  target_px: { x: 40, y: 42 },
  flux_mjy_sr: 3.2,
  flux_err_mjy_sr: 0.2,
  background_mjy_sr: 1.1,
  snr: 16,
  quality_flag: 0,
  is_usable: true,
  wavelength_um: null,
  bandwidth_um: null,
  date_obs: '2025-01-01T00:00:00Z',
  detector: 'DEMO-DET',
}

const response = {
  early_epoch_isolated: {
    isolated_png_url: 'https://example.test/early.png',
    target_px: { x: 40, y: 42 },
    source_measurement: measurement,
  },
  late_epoch_isolated: {
    isolated_png_url: 'https://example.test/late.png',
    target_px: { x: 41, y: 43 },
    source_measurement: { ...measurement, date_obs: '2025-01-02T00:00:00Z' },
  },
  angular_displacement_arcsec: 1.5,
  time_baseline_days: 1,
  apparent_motion_arcsec_per_yr: 547.8,
}

describe('parseIsolationJobResult', () => {
  it('accepts a result matching the OpenAPI IsolateResponse structure', () => {
    expect(parseIsolationJobResult(response)).toEqual(response)
  })

  it('rejects an incomplete or malformed completed-job result', () => {
    expect(parseIsolationJobResult({ status: 'completed' })).toBeNull()
    expect(parseIsolationJobResult(null)).toBeNull()
  })
})
