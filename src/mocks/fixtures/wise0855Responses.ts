import type { components } from '@/api/schema'
import { wise0855Search } from './wise0855Search'

type Source = components['schemas']['SourceIdentificationResponse']
type GaiaCrossmatchV21 = {
  matched: boolean
  discovery_status?: string
  gaia_source_id: string | null
  separation_arcsec: number | null
  g_mag: number | null
  pmra_mas_yr: number | null
  pmdec_mas_yr: number | null
  parallax_mas: number | null
}
type BackendV21Source = Source & {
  flux_ujy: number
  flux_err_ujy: number
  position_err_arcsec: number
  flag_labels: string[]
  gaia_crossmatch: GaiaCrossmatchV21 | null
}
type OverlayResponse = components['schemas']['OverlayResponse']
type BackendV21OverlayResponse = OverlayResponse & {
  wise_image_png_url: string
  fov_coverage_fraction: number
  coverage_complete: boolean
  coverage_warning: string | null
}
type DifferenceResponse = components['schemas']['DifferenceResponse']
type DifferenceCandidate = components['schemas']['DifferenceCandidate']
type BackendV21Candidate = Omit<DifferenceCandidate, 'match'> & {
  match: DifferenceCandidate['match'] & {
    gaia_source_id: string | null
    discovery_status: string
  }
}
type BackendV21DifferenceResponse = Omit<DifferenceResponse, 'candidates'> & {
  significance_png_url: string
  early_wavelength_um: number
  late_wavelength_um: number
  photometric_scale_factor: number
  wavelength_compatible: boolean
  scientific_warning: string | null
  display_scale: {
    vmin: number
    vmax: number
    unit: string
    stretch: string
    colormap: string
  }
  candidates: BackendV21Candidate[]
}
type IsolateResponse = components['schemas']['IsolateResponse']
type IsolatedEpochFrame = components['schemas']['IsolatedEpochFrame']
type BackendV21IsolatedEpochFrame = Omit<IsolatedEpochFrame, 'source_measurement'> & {
  source_measurement: BackendV21Source
  follow_object_png_url: string
  follow_object_with_bg_png_url: string
}
type BackendV21IsolateResponse = Omit<
  IsolateResponse,
  'early_epoch_isolated' | 'late_epoch_isolated'
> & {
  early_epoch_isolated: BackendV21IsolatedEpochFrame
  late_epoch_isolated: BackendV21IsolatedEpochFrame
  displacement_err_arcsec: number
  motion_err_arcsec_per_yr: number
}

const frames = wise0855Search.epochs[0].observations
export const wise0855EarlierFrame = frames[0]
export const wise0855LaterFrame = frames[1]

// Backend-provided POST /api/objects/identify response, limited to fields
// present in the repository's current generated OpenAPI 2.0.0 contract.
export const wise0855IdentifiedSource = {
  object_id: 'SPX-133.79458-7.24542',
  ra_deg: 133.79458,
  dec_deg: -7.24542,
  ra_hms: '08:55:10.699',
  dec_dms: '-07:14:43.51',
  fits_x: 72.814,
  fits_y: 73.112,
  png_x: 72.81,
  png_y: 71.89,
  target_px: { x: 72.81, y: 71.89 },
  flux_mjy_sr: 1.84215,
  flux_err_mjy_sr: 0.1421,
  background_mjy_sr: 0.0412,
  snr: 12.96,
  quality_flag: 2097152,
  is_usable: true,
  wavelength_um: 4.8604,
  bandwidth_um: 0.1185,
  date_obs: '2025-05-08T12:14:00.000',
  detector: '6',
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
} satisfies BackendV21Source

// Backend-provided POST /api/overlays sample. The WISE raster URL is an additive
// v2.1 field from the teammate's handoff; generated v2.0 types remain unchanged.
export const wise0855Overlays = {
  wise_image_png_url: '/api/cache/wise_layer_a1b2c3d4e5f67890.png',
  fov_coverage_fraction: 0.9982,
  coverage_complete: true,
  coverage_warning: null,
  image_shape_ny_nx: [146, 146],
  spherex_obs_date: '2025-05-08T12:14:00.000',
  target_px: { x: 72.5, y: 72.5 },
  gaia_dr3_sources: [
    {
      source_id: '5746824674801810816',
      ra_deg: 133.80124,
      dec_deg: -7.24011,
      ra_at_epoch_deg: 133.80119,
      dec_at_epoch_deg: -7.24015,
      pmra_mas_yr: -19.2,
      pmdec_mas_yr: -15.4,
      parallax_mas: 3.12,
      g_mag: 14.82,
      bp_rp: 1.15,
      ref_epoch: 2016,
      png_x: 68.92,
      png_y: 69.58,
      target_px: { x: 68.92, y: 69.58 },
      frame_px: {
        default: { x: 68.92, y: 69.58 },
        '2025W19_1B_0116_2D6': { x: 68.92, y: 69.58 },
      },
    },
  ],
  wise_sources: [
    {
      designation: 'J085510.83-071442.5',
      ra_deg: 133.795129,
      dec_deg: -7.245147,
      w1_mag: 17.82,
      w2_mag: 14.02,
      png_x: 72.5,
      png_y: 72.5,
      target_px: { x: 72.5, y: 72.5 },
      frame_px: {
        default: { x: 72.5, y: 72.5 },
        '2025W19_1B_0116_2D6': { x: 72.5, y: 72.5 },
      },
    },
  ],
  csa_neossat_observations: [],
  frame_overlays: {
    default: {
      frame_id: 'default',
      image_shape_ny_nx: [146, 146],
      target_px: { x: 72.5, y: 72.5 },
      gaia_px: { '5746824674801810816': { x: 68.92, y: 69.58 } },
      wise_px: { 'J085510.83-071442.5': { x: 72.5, y: 72.5 } },
    },
    '2025W19_1B_0116_2D6': {
      frame_id: '2025W19_1B_0116_2D6',
      image_shape_ny_nx: [146, 146],
      target_px: { x: 72.5, y: 72.5 },
      gaia_px: { '5746824674801810816': { x: 68.92, y: 69.58 } },
      wise_px: { 'J085510.83-071442.5': { x: 72.5, y: 72.5 } },
    },
  },
  wiseview_url:
    'https://byw.tools/wiseview#ra=133.795129&dec=-7.245147&size=900&band=3&speed=125&minbright=-15&maxbright=120',
} satisfies BackendV21OverlayResponse

// Backend-provided POST /api/images/difference sample, matching the current
// v2.0 response contract. v2.1 significance_png_url is not part of our current
// generated schema and is intentionally not added by hand.
export const wise0855Difference = {
  diff_key: '8f4b21a90c3e7d12',
  difference_png_url: '/api/cache/diff_8f4b21a90c3e7d12.png',
  significance_png_url: '/api/cache/sig_8f4b21a90c3e7d12.png',
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
  early_date: '2025-05-08T12:14:00.000',
  late_date: '2025-05-08T18:42:00.000',
  shape_ny_nx: [146, 146],
  target_px: { x: 72.5, y: 72.5 },
  comparable_with: [
    wise0855EarlierFrame.cutout_fits_url,
    wise0855LaterFrame.cutout_fits_url,
  ],
  candidates: [
    {
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
        counterpart_ra_deg: 133.79538,
        counterpart_dec_deg: -7.24511,
        counterpart_px: { x: 72.35, y: 72.48 },
        separation_arcsec: 8.102,
        apparent_motion_arcsec_yr: 8.081,
        gaia_source_id: null,
        discovery_status: 'unmatched_candidate_requires_verification',
      },
    },
  ],
} satisfies BackendV21DifferenceResponse

// Backend-provided POST /api/objects/isolate sample. The two follow-object PNG
// URLs are optional v2.1 response extensions from the teammate's actual sample;
// the generated v2.0 OpenAPI declaration remains unchanged.
export const wise0855Isolation = {
  early_epoch_isolated: {
    isolated_png_url: '/api/cache/isolated_c62d04923b470855.png',
    follow_object_png_url: '/api/cache/follow_iso_c62d04923b470855.png',
    follow_object_with_bg_png_url: '/api/cache/follow_bg_c62d04923b470855.png',
    target_px: { x: 72.81, y: 71.89 },
    source_measurement: { ...wise0855IdentifiedSource, gaia_crossmatch: null },
  },
  late_epoch_isolated: {
    isolated_png_url: '/api/cache/isolated_91e3a10b44f82c10.png',
    follow_object_png_url: '/api/cache/follow_iso_91e3a10b44f82c10.png',
    follow_object_with_bg_png_url: '/api/cache/follow_bg_91e3a10b44f82c10.png',
    target_px: { x: 74.12, y: 71.95 },
    source_measurement: {
      object_id: 'SPX-133.79232-7.24552',
      ra_deg: 133.79232,
      dec_deg: -7.24552,
      ra_hms: '08:55:10.157',
      dec_dms: '-07:14:43.87',
      fits_x: 74.121,
      fits_y: 73.051,
      png_x: 74.12,
      png_y: 71.95,
      target_px: { x: 74.12, y: 71.95 },
      flux_mjy_sr: 1.8104,
      flux_err_mjy_sr: 0.1398,
      background_mjy_sr: 0.0408,
      snr: 12.95,
      quality_flag: 2097152,
      is_usable: true,
      wavelength_um: 4.8619,
      bandwidth_um: 0.1186,
      date_obs: '2026-05-09T10:20:00.000',
      detector: '6',
      flux_ujy: 1609.446,
      flux_err_ujy: 124.282,
      position_err_arcsec: 0.363,
      flag_labels: ['SOURCE'],
      gaia_crossmatch: null,
    },
  },
  angular_displacement_arcsec: 8.099,
  displacement_err_arcsec: 0.513,
  time_baseline_days: 365.92,
  apparent_motion_arcsec_per_yr: 8.084,
  motion_err_arcsec_per_yr: 0.512,
} satisfies BackendV21IsolateResponse
