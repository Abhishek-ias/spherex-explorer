import { API_BASE_URL } from '@/api/baseUrl'
import { http, HttpResponse } from 'msw'
import type { components } from '@/api/schema'
import { presetTargets } from './fixtures/presetTargets'
import { wise0855Search } from './fixtures/wise0855Search'

type SearchRequest = components['schemas']['SearchRequest']
type SearchResponse = components['schemas']['SearchResponse']
type HealthResponse = components['schemas']['HealthResponse']

const WISE_0855 = presetTargets.find((target) => target.id === 'wise-0855')
const FIXTURE_TOLERANCE_DEG = 0.000001

function nearlyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= FIXTURE_TOLERANCE_DEG
}

export const handlers = [
  http.get(`${API_BASE_URL}/api/health`, () =>
    HttpResponse.json({
      status: 'mock',
      service: 'spherex-explorer',
      version: '2.0.0',
    } satisfies HealthResponse),
  ),

  http.get(`${API_BASE_URL}/api/targets`, () =>
    HttpResponse.json(presetTargets),
  ),

  http.post(`${API_BASE_URL}/api/search`, async ({ request }) => {
    const body = (await request.json()) as SearchRequest
    const ra = body.ra
    const dec = body.dec

    if (
      typeof ra !== 'number' ||
      typeof dec !== 'number' ||
      !Number.isFinite(ra) ||
      !Number.isFinite(dec) ||
      ra < 0 ||
      ra >= 360 ||
      dec < -90 ||
      dec > 90
    ) {
      return HttpResponse.json(
        { detail: 'Invalid right ascension or declination.' },
        { status: 422 },
      )
    }

    // The handoff contains a verified 15-arcmin WISE 0855 sample only.
    if (
      WISE_0855 &&
      nearlyEqual(ra, WISE_0855.ra_deg) &&
      nearlyEqual(dec, WISE_0855.dec_deg)
    ) {
      if ((body.fov_arcmin ?? 15) !== 15) {
        return HttpResponse.json(
          {
            detail:
              'The supplied WISE 0855 sample fixture is verified for a 15 arcmin field of view only.',
          },
          { status: 503 },
        )
      }

      return HttpResponse.json(wise0855Search)
    }

    const knownTarget = presetTargets.find(
      (target) =>
        nearlyEqual(ra, target.ra_deg) &&
        nearlyEqual(dec, target.dec_deg),
    )

    if (knownTarget) {
      return HttpResponse.json(
        {
          detail:
            `The target record is available, but a verified observation export for ${knownTarget.name} was not included in the backend handoff. Run the supplied IRSA frontend-fixture export script and add search_${knownTarget.id}.json before enabling its demo search.`,
        },
        { status: 503 },
      )
    }

    // Generic coordinates remain an explicitly empty DEMO DATA response.
    // No synthetic observations or scientific measurements are generated.
    const response: SearchResponse = {
      query_ra_deg: ra,
      query_dec_deg: dec,
      fov_arcmin: body.fov_arcmin ?? 15,
      total_observations: 0,
      detectors: [],
      wiseview_url: '',
      target_px: { x: 0, y: 0 },
      epochs: [],
    }

    return HttpResponse.json(response)
  }),
]
