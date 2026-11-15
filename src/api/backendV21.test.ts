import { describe, expect, it } from 'vitest'
import {
  readDifferenceV21Metadata,
  readObservationV21Metadata,
  readOverlayV21Metadata,
  readQualityFlagDefinitions,
  readSourceV21Metadata,
} from './backendV21'

describe('v2.1 observation metadata readers', () => {
  it('reads backend pixel scale, WCS orientation, units and survey pass', () => {
    expect(readObservationV21Metadata({
      pixel_scale_arcsec: 6.15,
      orientation: { north: 'up', east: 'left', origin: 'top_left' },
      flux_unit: 'MJy/sr',
      survey_week: '2025W19',
      survey_pass: '1B',
    })).toEqual({
      pixelScaleArcsec: 6.15,
      orientation: { north: 'up', east: 'left', origin: 'top_left' },
      fluxUnit: 'MJy/sr',
      surveyWeek: '2025W19',
      surveyPass: '1B',
    })
  })

  it('ignores malformed or absent optional metadata', () => {
    expect(readObservationV21Metadata({
      pixel_scale_arcsec: '6.15',
      orientation: { north: 'up', east: '', origin: 1 },
    })).toEqual({})
    expect(readObservationV21Metadata(null)).toEqual({})
  })
})

describe('v2.1 source metadata readers', () => {
  it('reads point flux, positional uncertainty, flags and Gaia crossmatch', () => {
    expect(readSourceV21Metadata({
      flux_ujy: 1637.671,
      flux_err_ujy: 126.327,
      position_err_arcsec: 0.362,
      flag_labels: ['SOURCE'],
      gaia_crossmatch: {
        matched: false,
        discovery_status: 'unmatched_candidate_requires_verification',
        gaia_source_id: null,
        separation_arcsec: 18.42,
        g_mag: null,
        pmra_mas_yr: null,
        pmdec_mas_yr: null,
        parallax_mas: null,
      },
    })).toEqual({
      fluxUjy: 1637.671,
      fluxErrorUjy: 126.327,
      positionErrorArcsec: 0.362,
      flagLabels: ['SOURCE'],
      gaiaCrossmatch: {
        matched: false,
        discoveryStatus: 'unmatched_candidate_requires_verification',
        sourceId: null,
        separationArcsec: 18.42,
        gMagnitude: null,
        pmraMasYr: null,
        pmdecMasYr: null,
        parallaxMas: null,
      },
    })
  })

  it('does not invent omitted source fields', () => {
    expect(readSourceV21Metadata({ flux_ujy: null, flag_labels: [1, 'SOURCE'] })).toEqual({
      flagLabels: ['SOURCE'],
    })
  })
})

describe('v2.1 overlay metadata', () => {
  it('reads coverage quality and nullable warnings', () => {
    expect(readOverlayV21Metadata({
      fov_coverage_fraction: 0.9982,
      coverage_complete: true,
      coverage_warning: null,
    })).toEqual({
      coverageFraction: 0.9982,
      coverageComplete: true,
      coverageWarning: null,
    })
  })

  it('rejects invalid coverage fractions', () => {
    expect(readOverlayV21Metadata({ fov_coverage_fraction: 1.5 }).coverageFraction)
      .toBeUndefined()
  })
})

describe('v2.1 difference metadata', () => {
  it('reads wavelength compatibility, scaling and warning fields', () => {
    expect(readDifferenceV21Metadata({
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
    })).toEqual({
      earlyWavelengthUm: 4.8604,
      lateWavelengthUm: 4.8619,
      photometricScaleFactor: 1.0124,
      wavelengthCompatible: true,
      scientificWarning: null,
      displayScale: {
        vmin: -0.85,
        vmax: 0.85,
        unit: 'MJy/sr',
        stretch: 'linear',
        colormap: 'coolwarm',
      },
    })
  })

  it('does not accept an invalid display range', () => {
    expect(readDifferenceV21Metadata({
      display_scale: {
        vmin: 1,
        vmax: -1,
        unit: 'MJy/sr',
        stretch: 'linear',
        colormap: 'coolwarm',
      },
    }).displayScale).toBeUndefined()
  })
})

describe('v2.1 quality flag definitions', () => {
  it('returns a sorted validated flag dictionary from health', () => {
    expect(readQualityFlagDefinitions({
      quality_flag_definitions: {
        '21': 'SOURCE',
        '0': 'TRANSIENT',
        bad: 'ignore',
      },
    })).toEqual([
      { bit: 0, label: 'TRANSIENT' },
      { bit: 21, label: 'SOURCE' },
    ])
  })

  it('returns no fabricated definitions when the health response has none', () => {
    expect(readQualityFlagDefinitions({ status: 'ok' })).toEqual([])
  })
})
