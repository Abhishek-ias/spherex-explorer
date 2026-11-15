import type { components } from '@/api/schema'

type SearchResponse = components['schemas']['SearchResponse']

// Exact verified WISE 0855-0714 SPHEREx DR1 sample from the backend handoff.
// Do not reuse these observation IDs, timestamps or URLs for other targets.
const baseCutoutUrl =
  'https://irsa.ipac.caltech.edu/ibe/data/spherex/dr1/level2/2025W19_1B/l2b-v27-2026-197/6/'
const cutoutQuery = '?center=133.795129,-7.245147d&size=0.2500'

export const wise0855Search = {
  query_ra_deg: 133.795129,
  query_dec_deg: -7.245147,
  fov_arcmin: 15,
  total_observations: 2,
  detectors: ['6'],
  wiseview_url: 'https://byw.tools/wiseview#ra=133.795129&dec=-7.245147&size=900&band=3&speed=125&minbright=-15&maxbright=120',
  target_px: { x: 72.5, y: 72.5 },
  epochs: [
    {
      epoch_id: '2025-S1',
      start_date: '2025-05-08T12:14:00.000',
      end_date: '2025-05-08T18:42:00.000',
      count: 2,
      detectors_available: ['6'],
      observations: [
        {
          obs_id: '2025W19_1B_0116_2D6',
          detector: '6',
          mjd: 60803.509722,
          date_iso: '2025-05-08T12:14:00.000',
          em_min_um: 4.41,
          em_max_um: 5.01,
          release: '7.0.5',
          full_fits_url: baseCutoutUrl + 'level2_2025W19_1B_0116_2D6_spx_l2b-v27-2026-197.fits',
          cutout_fits_url: baseCutoutUrl + 'level2_2025W19_1B_0116_2D6_spx_l2b-v27-2026-197.fits' + cutoutQuery,
          preview_png_url: '/api/preview?cutout_url=https%3A%2F%2Firsa.ipac.caltech.edu%2Fibe%2Fdata%2Fspherex%2Fdr1%2Flevel2%2F2025W19_1B%2Fl2b-v27-2026-197%2F6%2Flevel2_2025W19_1B_0116_2D6_spx_l2b-v27-2026-197.fits%3Fcenter%3D133.795129%2C-7.245147d%26size%3D0.2500&ra=133.795129&dec=-7.245147',
          target_px: { x: 72.5, y: 72.5 },
          comparable_with: ['2025W19_1B_0138_1D6'],
        },
        {
          obs_id: '2025W19_1B_0138_1D6',
          detector: '6',
          mjd: 60803.779167,
          date_iso: '2025-05-08T18:42:00.000',
          em_min_um: 4.41,
          em_max_um: 5.01,
          release: '7.0.5',
          full_fits_url: baseCutoutUrl + 'level2_2025W19_1B_0138_1D6_spx_l2b-v27-2026-197.fits',
          cutout_fits_url: baseCutoutUrl + 'level2_2025W19_1B_0138_1D6_spx_l2b-v27-2026-197.fits' + cutoutQuery,
          preview_png_url: '/api/preview?cutout_url=https%3A%2F%2Firsa.ipac.caltech.edu%2Fibe%2Fdata%2Fspherex%2Fdr1%2Flevel2%2F2025W19_1B%2Fl2b-v27-2026-197%2F6%2Flevel2_2025W19_1B_0138_1D6_spx_l2b-v27-2026-197.fits%3Fcenter%3D133.795129%2C-7.245147d%26size%3D0.2500&ra=133.795129&dec=-7.245147',
          target_px: { x: 72.5, y: 72.5 },
          comparable_with: ['2025W19_1B_0116_2D6'],
        },
      ],
    },
  ],
} satisfies SearchResponse
