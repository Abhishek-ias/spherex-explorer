
import { describe, expect, it } from 'vitest'
import { api } from '@/api/client'
import { getWiseImageLayerUrl } from '@/features/search/overlayResourceUtils'
import { readOverlayV21Metadata } from '@/api/backendV21'

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

  it('returns the backend-provided WISE 0855 source-identification measurement', async () => {
    const { data, error, response } = await api.POST('/api/objects/identify', {
      body: {
        cutout_fits_url:
          'https://irsa.ipac.caltech.edu/ibe/data/spherex/dr1/level2/2025W19_1B/l2b-v27-2026-197/6/level2_2025W19_1B_0116_2D6_spx_l2b-v27-2026-197.fits?center=133.795129,-7.245147d&size=0.2500',
        click_x: 73,
        click_y: 72,
        rendered_width: 146,
        rendered_height: 146,
      },
    })

    expect(response.status).toBe(200)
    expect(error).toBeUndefined()
    expect(data).toMatchObject({
      object_id: 'SPX-133.79458-7.24542',
      ra_deg: 133.79458,
      dec_deg: -7.24542,
      target_px: { x: 72.81, y: 71.89 },
      flux_mjy_sr: 1.84215,
      flux_ujy: 1637.671,
      flux_err_ujy: 126.327,
      position_err_arcsec: 0.362,
      flag_labels: ['SOURCE'],
      gaia_crossmatch: {
        matched: false,
        discovery_status: 'unmatched_candidate_requires_verification',
        separation_arcsec: 18.42,
      },
      snr: 12.96,
      quality_flag: 2097152,
    })
  })

  it('returns backend-provided Gaia DR3 and WISE overlay positions', async () => {
    const { data, error, response } = await api.POST('/api/overlays', {
      body: {
        cutout_fits_url:
          'https://irsa.ipac.caltech.edu/ibe/data/spherex/dr1/level2/2025W19_1B/l2b-v27-2026-197/6/level2_2025W19_1B_0116_2D6_spx_l2b-v27-2026-197.fits?center=133.795129,-7.245147d&size=0.2500',
        ra: 133.795129,
        dec: -7.245147,
        fov_arcmin: 15,
        frame_cutout_urls: {
          '2025W19_1B_0116_2D6':
            'https://irsa.ipac.caltech.edu/ibe/data/spherex/dr1/level2/2025W19_1B/l2b-v27-2026-197/6/level2_2025W19_1B_0116_2D6_spx_l2b-v27-2026-197.fits?center=133.795129,-7.245147d&size=0.2500',
        },
      },
    })

    expect(response.status).toBe(200)
    expect(error).toBeUndefined()
    expect(data?.gaia_dr3_sources[0]).toMatchObject({
      source_id: '5746824674801810816',
      png_x: 68.92,
      png_y: 69.58,
    })
    expect(data?.wise_sources[0]).toMatchObject({
      designation: 'J085510.83-071442.5',
      w1_mag: 17.82,
      w2_mag: 14.02,
    })
    expect(getWiseImageLayerUrl(data)).toBe(
      '/api/cache/wise_layer_a1b2c3d4e5f67890.png',
    )
    expect(readOverlayV21Metadata(data)).toEqual({
      coverageFraction: 0.9982,
      coverageComplete: true,
      coverageWarning: null,
    })
  })

  it('returns the backend-provided WISE 0855 difference candidate', async () => {
    const cutout =
      'https://irsa.ipac.caltech.edu/ibe/data/spherex/dr1/level2/2025W19_1B/l2b-v27-2026-197/6/'
    const query = '?center=133.795129,-7.245147d&size=0.2500'
    const { data, error, response } = await api.POST('/api/images/difference', {
      body: {
        early_cutout_fits_url:
          cutout + 'level2_2025W19_1B_0116_2D6_spx_l2b-v27-2026-197.fits' + query,
        late_cutout_fits_url:
          cutout + 'level2_2025W19_1B_0138_1D6_spx_l2b-v27-2026-197.fits' + query,
        ra: 133.795129,
        dec: -7.245147,
      },
    })

    expect(response.status).toBe(200)
    expect(error).toBeUndefined()
    expect(data).toMatchObject({
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
      candidates: [{
        candidate_id: 'CAND-01',
        significance_sigma: 6.45,
        match: {
          matched: true,
          match_type: 'moving_dipole_pair',
          gaia_source_id: null,
          discovery_status: 'unmatched_candidate_requires_verification',
        },
      }],
    })
  })

  it('returns the backend-provided two-epoch source isolation measurements', async () => {
    const cutout =
      'https://irsa.ipac.caltech.edu/ibe/data/spherex/dr1/level2/2025W19_1B/l2b-v27-2026-197/6/'
    const query = '?center=133.795129,-7.245147d&size=0.2500'
    const { data, error, response } = await api.POST('/api/objects/isolate', {
      body: {
        early_cutout_fits_url:
          cutout + 'level2_2025W19_1B_0116_2D6_spx_l2b-v27-2026-197.fits' + query,
        late_cutout_fits_url:
          cutout + 'level2_2025W19_1B_0138_1D6_spx_l2b-v27-2026-197.fits' + query,
        object_ra: 133.79458,
        object_dec: -7.24542,
        isolation_radius_pix: 4.5,
      },
    })

    expect(response.status).toBe(200)
    expect(error).toBeUndefined()
    expect(data).toMatchObject({
      angular_displacement_arcsec: 8.099,
      time_baseline_days: 365.92,
      apparent_motion_arcsec_per_yr: 8.084,
      early_epoch_isolated: {
        isolated_png_url: '/api/cache/isolated_c62d04923b470855.png',
        source_measurement: {
          flux_ujy: 1637.671,
          flux_err_ujy: 126.327,
          position_err_arcsec: 0.362,
          flag_labels: ['SOURCE'],
        },
      },
      late_epoch_isolated: {
        isolated_png_url: '/api/cache/isolated_91e3a10b44f82c10.png',
        source_measurement: {
          flux_ujy: 1609.446,
          flux_err_ujy: 124.282,
          position_err_arcsec: 0.363,
          flag_labels: ['SOURCE'],
        },
      },
      displacement_err_arcsec: 0.513,
      motion_err_arcsec_per_yr: 0.512,
    })
  })

  it('simulates the supplied background job lifecycle for a difference task', async () => {
    const cutout =
      'https://irsa.ipac.caltech.edu/ibe/data/spherex/dr1/level2/2025W19_1B/l2b-v27-2026-197/6/'
    const query = '?center=133.795129,-7.245147d&size=0.2500'
    const payload = {
      early_cutout_fits_url:
        cutout + 'level2_2025W19_1B_0116_2D6_spx_l2b-v27-2026-197.fits' + query,
      late_cutout_fits_url:
        cutout + 'level2_2025W19_1B_0138_1D6_spx_l2b-v27-2026-197.fits' + query,
      ra: 133.795129,
      dec: -7.245147,
    }

    const submitted = await api.POST('/api/jobs', {
      body: { job_type: 'difference_image', payload },
    })
    expect(submitted.response.status).toBe(200)
    expect(submitted.data?.status).toBe('queued')
    expect(submitted.data?.progress_pct).toBe(0)

    const running = await api.GET('/api/jobs/{id}', {
      params: { path: { id: submitted.data!.id } },
    })
    expect(running.data?.status).toBe('running')
    expect(running.data?.progress_pct).toBe(20)

    const completed = await api.GET('/api/jobs/{id}', {
      params: { path: { id: submitted.data!.id } },
    })
    expect(completed.data?.status).toBe('completed')
    expect(completed.data?.progress_pct).toBe(100)
    expect(completed.data?.result).toMatchObject({
      diff_key: '8f4b21a90c3e7d12',
    })
  })

  it('simulates a failed job when no comparable observation pair exists', async () => {
    const submitted = await api.POST('/api/jobs', {
      body: {
        job_type: 'difference_image',
        payload: {
          early_cutout_fits_url: 'https://example.test/early.fits',
          late_cutout_fits_url: 'https://example.test/late.fits',
          ra: 1,
          dec: 1,
        },
      },
    })
    expect(submitted.response.status).toBe(200)
    expect(submitted.data?.status).toBe('queued')

    const running = await api.GET('/api/jobs/{id}', {
      params: { path: { id: submitted.data!.id } },
    })
    expect(running.data?.status).toBe('running')

    const failed = await api.GET('/api/jobs/{id}', {
      params: { path: { id: submitted.data!.id } },
    })
    expect(failed.data?.status).toBe('failed')
    expect(failed.data?.error).toContain('No comparable SPHEREx observation pair')
    expect(failed.data?.result).toBeNull()
  })

  it('returns a typed mock backend health response', async () => {
    const { data, error, response } = await api.GET('/api/health')

    expect(response.status).toBe(200)
    expect(error).toBeUndefined()
    expect(data).toMatchObject({
      status: 'mock',
      service: 'spherex-explorer',
      version: '2.1.0',
      quality_flag_definitions: {
        '0': 'TRANSIENT (Cosmic ray or transient spike)',
        '21': 'SOURCE (Detected astronomical point/extended source)',
      },
    })
  })

  it('returns a typed DEMO DATA search response', async () => {
    const { data, error, response } = await api.POST('/api/search', {
      body: {
        ra: 130.123456,
        dec: -6.543210,
        fov_arcmin: 15,
      },
    })

    expect(response.status).toBe(200)
    expect(error).toBeUndefined()

    expect(data).toMatchObject({
      query_ra_deg: 130.123456,
      query_dec_deg: -6.543210,
      fov_arcmin: 15,
      total_observations: 0,
      epochs: [],
    })
  })
})
