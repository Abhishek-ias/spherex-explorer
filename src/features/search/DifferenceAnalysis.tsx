import { useState } from 'react'
import { useDifferenceImage } from '@/api/hooks/useDifferenceImage'
import { useDifferenceJob } from '@/api/hooks/useDifferenceJob'
import type { components } from '@/api/schema'
import SynchronizedDifferenceViewer from './SynchronizedDifferenceViewer'

type ObservationFrame = components['schemas']['ObservationFrame']
type Props = {
  ra: number
  dec: number
  firstFrame?: ObservationFrame
  secondFrame?: ObservationFrame
}

export default function DifferenceAnalysis({
  ra,
  dec,
  firstFrame,
  secondFrame,
}: Props) {
  const difference = useDifferenceImage()
  const job = useDifferenceJob()
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [jobFallbackMessage, setJobFallbackMessage] = useState('')

  const result = job.result ?? difference.data
  const jobPayload = firstFrame && secondFrame
    ? {
        early_cutout_fits_url: firstFrame.mjd <= secondFrame.mjd
          ? firstFrame.cutout_fits_url
          : secondFrame.cutout_fits_url,
        late_cutout_fits_url: firstFrame.mjd <= secondFrame.mjd
          ? secondFrame.cutout_fits_url
          : firstFrame.cutout_fits_url,
        ra,
        dec,
      }
    : null

  if (!firstFrame || !secondFrame) {
    return (
      <section className="rounded-xl border border-observatory-border bg-observatory-surface p-5">
        <h2 className="font-heading text-xl font-semibold">Difference imaging</h2>
        <p className="mt-2 text-sm text-observatory-muted">
          Select an observation with a backend-approved comparable frame to generate a difference image.
        </p>
      </section>
    )
  }

  const earlier = firstFrame.mjd <= secondFrame.mjd ? firstFrame : secondFrame
  const later = firstFrame.mjd <= secondFrame.mjd ? secondFrame : firstFrame

  const canGenerate =
    Boolean(earlier.cutout_fits_url) &&
    Boolean(later.cutout_fits_url) &&
    earlier.obs_id !== later.obs_id

  return (
    <section id="difference-analysis" className="space-y-5 rounded-2xl border border-observatory-border bg-observatory-surface p-5 sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-observatory-cyan">
          Phase 6 · Candidate analysis
        </p>
        <h2 className="mt-2 font-heading text-2xl font-semibold">
          Difference imaging
        </h2>
        <p className="mt-2 text-sm text-observatory-muted">
          Backend-aligned later-minus-earlier residual image and potential detections.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-observatory-border p-4">
          <p className="text-xs text-blue-300">Earlier observation</p>
          <p className="mt-1 break-all font-mono text-xs">{earlier.obs_id}</p>
          <p className="mt-2 text-sm text-observatory-muted">{earlier.date_iso}</p>
        </div>
        <div className="rounded-lg border border-observatory-border p-4">
          <p className="text-xs text-violet-300">Later observation</p>
          <p className="mt-1 break-all font-mono text-xs">{later.obs_id}</p>
          <p className="mt-2 text-sm text-observatory-muted">{later.date_iso}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!canGenerate || job.submit.isPending || difference.isPending}
          onClick={() => {
            if (!jobPayload) return
            setJobFallbackMessage('')
            difference.reset()
            job.reset()
            setSelectedCandidateId(null)
            job.submit.mutate(jobPayload)
          }}
          className="rounded-lg bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {job.submit.isPending ? 'Submitting job…' : 'Generate with background job'}
        </button>
        <button
          type="button"
          disabled={!canGenerate || difference.isPending || job.submit.isPending}
          onClick={() => {
            setJobFallbackMessage('Using the synchronous difference endpoint.')
            job.reset()
            setSelectedCandidateId(null)
            difference.mutate({
              early_cutout_fits_url: earlier.cutout_fits_url,
              late_cutout_fits_url: later.cutout_fits_url,
              ra,
              dec,
            })
          }}
          className="rounded-lg border border-observatory-border px-4 py-3 text-sm hover:border-observatory-cyan disabled:cursor-not-allowed disabled:opacity-40"
        >
          Run directly instead
        </button>
      </div>

      {job.submit.isPending && (
        <p role="status" className="text-sm text-observatory-muted">
          Submitting the difference task to the backend job queue…
        </p>
      )}

      {job.status && (
        <div className="space-y-3 rounded-xl border border-observatory-border bg-[#080f1c] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Background job · {job.status.status}</p>
              <p className="mt-1 font-mono text-[11px] text-observatory-muted">
                {job.status.id}
              </p>
            </div>
            <span className="font-mono text-sm tabular-nums">
              {Math.round(job.status.progress_pct)}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Difference job progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={job.status.progress_pct}
            className="h-2 overflow-hidden rounded-full bg-observatory-border"
          >
            <div
              className="h-full rounded-full bg-observatory-cyan transition-all"
              style={{ width: `${Math.max(0, Math.min(100, job.status.progress_pct))}%` }}
            />
          </div>
          {job.status.status === 'queued' || job.status.status === 'running' ? (
            <div className="flex flex-wrap items-center gap-3 text-xs text-observatory-muted">
              <span>{job.isMonitoring ? 'Status refreshes automatically.' : 'Status monitoring is paused; backend processing may continue.'}</span>
              {job.isMonitoring ? (
                <button type="button" onClick={() => void job.stopMonitoring()} className="underline">
                  Stop monitoring
                </button>
              ) : (
                <button type="button" onClick={job.resumeMonitoring} className="underline">
                  Resume monitoring
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-observatory-muted">
              {job.status.status === 'completed'
                ? 'The backend marked this job completed.'
                : job.status.error || 'The backend job failed.'}
            </p>
          )}
        </div>
      )}

      {job.queryError && (
        <div role="alert" className="rounded-lg border border-red-900/70 bg-red-950/20 p-4 text-sm text-red-300">
          {job.queryError.message}
          <button type="button" className="ml-3 underline" onClick={job.resumeMonitoring}>
            Retry monitoring
          </button>
        </div>
      )}

      {job.submit.isError && (
        <div role="alert" className="rounded-lg border border-red-900/70 bg-red-950/20 p-4 text-sm text-red-300">
          {job.submit.error.message}
          <p className="mt-2 text-xs text-red-200/80">
            The job endpoint may not be enabled on the backend yet. Use the direct endpoint as a fallback.
          </p>
        </div>
      )}

      {job.invalidCompletedResult && (
        <div role="alert" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
          The job finished, but its result does not match the current DifferenceResponse schema.
          No result image or candidate data will be inferred from it.
        </div>
      )}

      {difference.isPending && (
        <p role="status" className="text-sm text-observatory-muted">
          The synchronous endpoint is aligning the observation frames and calculating residuals.
        </p>
      )}

      {difference.isError && (
        <div role="alert" className="rounded-lg border border-red-900/70 bg-red-950/20 p-4 text-sm text-red-300">
          {difference.error?.message || 'Difference request failed.'}
          <button type="button" className="ml-3 underline" onClick={() => difference.reset()}>
            Dismiss
          </button>
        </div>
      )}

      {jobFallbackMessage && (
        <p className="text-xs text-observatory-muted">{jobFallbackMessage}</p>
      )}

      {result && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs text-violet-300">
              {result.candidates.length} potential detections
            </span>
            <span className="font-mono text-xs text-observatory-muted">
              {result.shape_ny_nx.join(' × ')} pixels
            </span>
          </div>

          <SynchronizedDifferenceViewer
            earlierUrl={earlier.preview_png_url}
            laterUrl={later.preview_png_url}
            differenceUrl={result.difference_png_url}
            shapeNyNx={result.shape_ny_nx}
            selectedCandidate={result.candidates.find(
              (candidate) => candidate.candidate_id === selectedCandidateId,
            )}
          />
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-observatory-border p-3 text-xs">
            <span className="text-observatory-muted">Residual direction:</span>
            <span className="text-emerald-300">Positive = later brighter</span>
            <span className="text-blue-300">Negative = earlier brighter</span>
            <span className="text-observatory-muted">Near zero = little change</span>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-observatory-muted">
            The current difference response does not include colour-scale limits (vmin/vmax),
            a colour-map name, or a significance-map URL. Those controls are unavailable until
            the backend returns those fields.
          </div>

          {result.candidates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-observatory-border p-5 text-sm text-observatory-muted">
              The backend returned no potential detections for this pair.
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-semibold">Potential detections</h3>
              {result.candidates.map((candidate) => (
                <button
                  type="button"
                  key={candidate.candidate_id}
                  aria-pressed={candidate.candidate_id === selectedCandidateId}
                  onClick={() => setSelectedCandidateId(candidate.candidate_id)}
                  className={`block w-full rounded-xl border bg-[#080f1c] p-4 text-left transition ${
                    candidate.candidate_id === selectedCandidateId
                      ? 'border-amber-400 bg-amber-500/10'
                      : 'border-observatory-border hover:border-observatory-cyan'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-mono text-sm font-semibold">
                      {candidate.candidate_id}
                    </p>
                    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-300">
                      {candidate.significance_sigma.toFixed(2)} σ
                    </span>
                  </div>

                  <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                    <div>
                      <p className="text-observatory-muted">Residual</p>
                      <p className="mt-1">
                        {candidate.residual_type === 'positive_later_brighter'
                          ? 'Later epoch brighter'
                          : 'Earlier epoch brighter'}
                      </p>
                    </div>
                    <div>
                      <p className="text-observatory-muted">Peak residual</p>
                      <p className="mt-1 font-mono">
                        {candidate.peak_residual_mjy_sr} MJy/sr
                      </p>
                    </div>
                    <div>
                      <p className="text-observatory-muted">RA / Dec</p>
                      <p className="mt-1 font-mono">
                        {candidate.ra_deg.toFixed(6)}°, {candidate.dec_deg.toFixed(6)}°
                      </p>
                    </div>
                    <div>
                      <p className="text-observatory-muted">Match type</p>
                      <p className="mt-1">{candidate.match.match_type}</p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-observatory-muted">
                    {candidate.match.matched
                      ? 'Backend reports a cross-epoch match.'
                      : 'No cross-epoch match reported.'}
                    {candidate.match.apparent_motion_arcsec_yr !== null &&
                      candidate.match.apparent_motion_arcsec_yr !== undefined &&
                      ` Apparent motion: ${candidate.match.apparent_motion_arcsec_yr} arcsec/year.`}
                  </p>
                  <p className="mt-3 text-[11px] text-observatory-muted">
                    Difference-image pixel: ({candidate.png_x.toFixed(1)}, {candidate.png_y.toFixed(1)})
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}