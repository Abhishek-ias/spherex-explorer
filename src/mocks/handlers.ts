import { API_BASE_URL } from '@/api/baseUrl'
import { http, HttpResponse } from 'msw'
import type { components } from '@/api/schema'
import { presetTargets } from './fixtures/presetTargets'
import { wise0855Search } from './fixtures/wise0855Search'
import {
  wise0855Difference,
  wise0855EarlierFrame,
  wise0855IdentifiedSource,
  wise0855Isolation,
  wise0855LaterFrame,
  wise0855Overlays,
} from './fixtures/wise0855Responses'

type SearchRequest = components['schemas']['SearchRequest']
type SearchResponse = components['schemas']['SearchResponse']
type HealthResponse = components['schemas']['HealthResponse']
type IdentifyRequest = components['schemas']['IdentifyRequest']
type OverlayRequest = components['schemas']['OverlayRequest']
type DifferenceRequest = components['schemas']['DifferenceRequest']
type IsolateRequest = components['schemas']['IsolateRequest']
type JobSubmitRequest = components['schemas']['JobSubmitRequest']
type JobStatusResponse = components['schemas']['JobStatusResponse']

const WISE_0855 = presetTargets.find((target) => target.id === 'wise-0855')
const FIXTURE_TOLERANCE_DEG = 0.000001

function nearlyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= FIXTURE_TOLERANCE_DEG
}

function isWiseFrameUrl(value: unknown, obsId: string): boolean {
  return typeof value === 'string' && value.includes(obsId)
}

function isWisePair(earlyUrl: unknown, lateUrl: unknown): boolean {
  return (
    (isWiseFrameUrl(earlyUrl, wise0855EarlierFrame.obs_id) &&
      isWiseFrameUrl(lateUrl, wise0855LaterFrame.obs_id)) ||
    (isWiseFrameUrl(earlyUrl, wise0855LaterFrame.obs_id) &&
      isWiseFrameUrl(lateUrl, wise0855EarlierFrame.obs_id))
  )
}

type DemoJob = {
  status: JobStatusResponse
  result: Record<string, unknown> | null
  failure: string | null
  polls: number
}

const demoJobs = new Map<string, DemoJob>()
let nextJobNumber = 1

function nowIso(): string {
  return new Date().toISOString()
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

  http.post(`${API_BASE_URL}/api/objects/identify`, async ({ request }) => {
    const body = (await request.json()) as IdentifyRequest
    const isSampleFrame = isWiseFrameUrl(
      body.cutout_fits_url,
      wise0855EarlierFrame.obs_id,
    )
    const isSamplePixel =
      Math.abs(body.click_x - 73) <= 2 &&
      Math.abs(body.click_y - 72) <= 2 &&
      Math.abs(body.rendered_width - 146) <= 2 &&
      Math.abs(body.rendered_height - 146) <= 2

    if (isSampleFrame && isSamplePixel) {
      return HttpResponse.json(wise0855IdentifiedSource)
    }

    return HttpResponse.json(
      { detail: 'No identification fixture is available at this selected pixel.' },
      { status: 404 },
    )
  }),

  http.post(`${API_BASE_URL}/api/overlays`, async ({ request }) => {
    const body = (await request.json()) as OverlayRequest
    if (
      typeof body.ra === 'number' &&
      typeof body.dec === 'number' &&
      nearlyEqual(body.ra, 133.795129) &&
      nearlyEqual(body.dec, -7.245147) &&
      isWiseFrameUrl(body.cutout_fits_url, wise0855EarlierFrame.obs_id)
    ) {
      return HttpResponse.json(wise0855Overlays)
    }

    return HttpResponse.json(
      { detail: 'No catalogue overlay fixture is available for this frame.' },
      { status: 404 },
    )
  }),

  http.post(`${API_BASE_URL}/api/images/difference`, async ({ request }) => {
    const body = (await request.json()) as DifferenceRequest
    if (isWisePair(body.early_cutout_fits_url, body.late_cutout_fits_url)) {
      return HttpResponse.json(wise0855Difference)
    }

    return HttpResponse.json(
      { detail: 'No difference-image fixture is available for this observation pair.' },
      { status: 404 },
    )
  }),

  http.post(`${API_BASE_URL}/api/objects/isolate`, async ({ request }) => {
    const body = (await request.json()) as IsolateRequest
    if (
      isWisePair(body.early_cutout_fits_url, body.late_cutout_fits_url) &&
      nearlyEqual(body.object_ra, wise0855IdentifiedSource.ra_deg) &&
      nearlyEqual(body.object_dec, wise0855IdentifiedSource.dec_deg)
    ) {
      return HttpResponse.json(wise0855Isolation)
    }

    return HttpResponse.json(
      { detail: 'No source-isolation fixture is available for this source and pair.' },
      { status: 404 },
    )
  }),

  http.post(`${API_BASE_URL}/api/spectra/compare`, () =>
    HttpResponse.json(
      {
        detail:
          'A complete 102-channel mock spectrum fixture was not included. The supplied example is an excerpt and the WISE 0855 search sample currently contains one survey epoch.',
      },
      { status: 503 },
    ),
  ),

  http.post(`${API_BASE_URL}/api/jobs`, async ({ request }) => {
    const body = (await request.json()) as JobSubmitRequest
    const now = nowIso()
    const id = `demo-${body.job_type}-${nextJobNumber++}`
    let result: Record<string, unknown> | null = null
    let failure: string | null = null

    if (body.job_type === 'difference_image') {
      const payload = body.payload as unknown as DifferenceRequest
      if (isWisePair(payload.early_cutout_fits_url, payload.late_cutout_fits_url)) {
        result = wise0855Difference
      } else {
        failure = '404: No comparable SPHEREx observation pair found for this position.'
      }
    } else if (body.job_type === 'object_isolate') {
      const payload = body.payload as unknown as IsolateRequest
      if (
        isWisePair(payload.early_cutout_fits_url, payload.late_cutout_fits_url) &&
        nearlyEqual(payload.object_ra, wise0855IdentifiedSource.ra_deg) &&
        nearlyEqual(payload.object_dec, wise0855IdentifiedSource.dec_deg)
      ) {
        result = wise0855Isolation
      } else {
        failure = '404: No SPHEREx observations found for this position.'
      }
    } else {
      return HttpResponse.json(
        {
          detail:
            'A complete 102-channel spectrum fixture was not included in the backend handoff.',
        },
        { status: 503 },
      )
    }

    const status: JobStatusResponse = {
      id,
      job_type: body.job_type,
      status: 'queued',
      progress_pct: 0,
      created_at: now,
      updated_at: now,
      result: null,
      error: null,
    }
    demoJobs.set(id, { status, result, failure, polls: 0 })
    return HttpResponse.json(status)
  }),

  http.get(`${API_BASE_URL}/api/jobs/:id`, ({ params }) => {
    const id = String(params.id)
    const job = demoJobs.get(id)
    if (!job) {
      return HttpResponse.json({ detail: 'Demo job not found.' }, { status: 404 })
    }

    job.polls += 1
    const updatedAt = nowIso()

    if (job.polls === 1) {
      job.status = {
        ...job.status,
        status: 'running',
        progress_pct: 20,
        updated_at: updatedAt,
      }
    } else {
      job.status = {
        ...job.status,
        status: job.failure ? 'failed' : 'completed',
        progress_pct: job.failure ? 20 : 100,
        updated_at: updatedAt,
        result: job.failure ? null : job.result,
        error: job.failure,
      }
    }

    return HttpResponse.json(job.status)
  }),
]
