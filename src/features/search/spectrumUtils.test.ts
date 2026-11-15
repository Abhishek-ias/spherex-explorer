import { describe, expect, it } from 'vitest'
import type { components } from '@/api/schema'
import { getChannelCoverage, getFlaggedRawPoints } from './spectrumUtils'

type EpochSpectrumBundle = components['schemas']['EpochSpectrumBundle']
type RawSpectralPoint = components['schemas']['RawSpectralPoint']

const bundle: EpochSpectrumBundle = {
  epoch_id: 'epoch-test',
  raw_points: [],
  channels_102: [
    { channel: 1, wavelength_um: 0.8, bandwidth_um: 0.01, flux: 12, flux_err: 1, n_exposures: 3, measured: true },
    { channel: 2, wavelength_um: 0.9, bandwidth_um: 0.01, flux: null, flux_err: null, n_exposures: 0, measured: false },
    { channel: 3, wavelength_um: 1.0, bandwidth_um: 0.01, flux: 14, flux_err: null, n_exposures: 2, measured: true },
  ],
}

const rawPoints: RawSpectralPoint[] = [
  { obs_id: 'obs-1', detector: 'D1', date_iso: '2025-01-01T00:00:00Z', mjd: 60000, wavelength_um: 0.8, bandwidth_um: 0.01, flux: 12, flux_err: 1, snr: 12, quality_flag: 0 },
  { obs_id: 'obs-2', detector: 'D1', date_iso: '2025-01-02T00:00:00Z', mjd: 60001, wavelength_um: 0.9, bandwidth_um: 0.01, flux: 9, flux_err: 2, snr: 4.5, quality_flag: 2 },
]

describe('spectrum quality summaries', () => {
  it('counts channels only when measured and flux is present', () => {
    expect(getChannelCoverage(bundle)).toEqual({
      available: 2,
      returned: 3,
      total: 102,
      wavelengthMinUm: 0.8,
      wavelengthMaxUm: 1.0,
    })
  })

  it('keeps the raw numeric quality flag values without interpreting them', () => {
    expect(getFlaggedRawPoints(rawPoints).map((point) => point.quality_flag))
      .toEqual([2])
  })

  it('reports no coverage when there are no measured channel fluxes', () => {
    expect(getChannelCoverage({
      epoch_id: 'empty',
      raw_points: [],
      channels_102: [],
    }).wavelengthMinUm).toBeNull()
  })
})
