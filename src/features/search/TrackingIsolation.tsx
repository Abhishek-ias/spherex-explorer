import { useEffect, useState } from 'react'
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { useIsolateObject } from '@/api/hooks/useIsolateObject'
import { useObjectIsolationJob } from '@/api/hooks/useObjectIsolationJob'
import type { components } from '@/api/schema'
import { getNextSequenceIndex, normalizeSequenceIndex } from './isolationSequence'
import { resolveApiAssetUrl } from '@/api/resolveApiAssetUrl'
import BackendImage from './BackendImage'

type ObservationFrame = components['schemas']['ObservationFrame']
type Source = components['schemas']['SourceIdentificationResponse']
type Props = {
  firstFrame?: ObservationFrame
  secondFrame?: ObservationFrame
  source?: Source
}

export default function TrackingIsolation({
  firstFrame,
  secondFrame,
  source,
}: Props) {
  const isolation = useIsolateObject()
  const job = useObjectIsolationJob()
  const isolationResult = job.result ?? isolation.data
  const [activeIndex, setActiveIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState('1')

  const canIsolate =
    Boolean(firstFrame?.cutout_fits_url) &&
    Boolean(secondFrame?.cutout_fits_url) &&
    Boolean(source)

  const sequence = isolationResult
    ? [
        {
          label: 'Earlier isolated epoch',
          frame: isolationResult.early_epoch_isolated,
        },
        {
          label: 'Later isolated epoch',
          frame: isolationResult.late_epoch_isolated,
        },
      ]
    : []
  const safeIndex = normalizeSequenceIndex(activeIndex, sequence.length)
  const activeFrame = safeIndex >= 0 ? sequence[safeIndex] : undefined

  useEffect(() => {
    if (!playing || sequence.length < 2) return

    const interval = window.setInterval(() => {
      setActiveIndex((current) => getNextSequenceIndex(current, sequence.length))
    }, Math.max(300, 1400 / Number(speed)))

    return () => window.clearInterval(interval)
  }, [playing, speed, sequence.length])

  function runIsolation() {
    if (!firstFrame || !secondFrame || !source) return

    const early = firstFrame.mjd <= secondFrame.mjd ? firstFrame : secondFrame
    const late = firstFrame.mjd <= secondFrame.mjd ? secondFrame : firstFrame

    setPlaying(false)
    setActiveIndex(0)
    isolation.reset()
    job.reset()
    job.submit.mutate({
      early_cutout_fits_url: early.cutout_fits_url,
      late_cutout_fits_url: late.cutout_fits_url,
      object_ra: source.ra_deg,
      object_dec: source.dec_deg,
      isolation_radius_pix: 4.5,
    })
  }

  return (
    <section id="tracking-isolation" className="space-y-5 rounded-2xl border border-observatory-border bg-observatory-surface p-5 sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-observatory-cyan">
          Phase 7 · Motion investigation
        </p>
        <h2 className="mt-2 font-heading text-2xl font-semibold">
          Tracking & isolation
        </h2>
        <p className="mt-2 text-sm text-observatory-muted">
          Isolate an identified source across two available observation epochs.
        </p>
      </div>

      {!source && (
        <div className="rounded-xl border border-dashed border-observatory-border p-4 text-sm text-observatory-muted">
          Identify an object in the sky viewer first. Its backend-measured
          coordinates will be used for isolation.
        </div>
      )}

      {source && (
        <div className="rounded-lg border border-observatory-border p-4 text-sm">
          <p className="text-xs text-observatory-muted">Selected backend source</p>
          <p className="mt-1 font-mono">{source.object_id}</p>
          <p className="mt-1 text-xs text-observatory-muted">
            RA {source.ra_deg.toFixed(6)}° · Dec {source.dec_deg.toFixed(6)}°
          </p>
          <p className="mt-1 text-xs text-observatory-muted">
            Only backend-returned isolation cutouts are displayed.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runIsolation}
          disabled={!canIsolate || job.submit.isPending || isolation.isPending}
          className="rounded-lg bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {job.submit.isPending ? 'Submitting job…' : 'Isolate with background job'}
        </button>
        <button
          type="button"
          disabled={!canIsolate || isolation.isPending || job.submit.isPending}
          onClick={() => {
            if (!firstFrame || !secondFrame || !source) return
            const early = firstFrame.mjd <= secondFrame.mjd ? firstFrame : secondFrame
            const late = firstFrame.mjd <= secondFrame.mjd ? secondFrame : firstFrame
            job.reset()
            isolation.mutate({
              early_cutout_fits_url: early.cutout_fits_url,
              late_cutout_fits_url: late.cutout_fits_url,
              object_ra: source.ra_deg,
              object_dec: source.dec_deg,
              isolation_radius_pix: 4.5,
            })
          }}
          className="rounded-lg border border-observatory-border px-4 py-3 text-sm hover:border-observatory-cyan disabled:opacity-40"
        >
          Run directly instead
        </button>
        {job.submit.isPending && (
          <span role="status" className="text-xs text-observatory-muted">
            Submitting isolation to the backend job queue.
          </span>
        )}
        {isolation.isPending && (
          <span role="status" className="text-xs text-observatory-muted">
            Processing is performed by the synchronous backend endpoint.
          </span>
        )}
      </div>

      {job.status && (
        <div className="space-y-3 rounded-xl border border-observatory-border bg-[#080f1c] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Isolation job · {job.status.status}</p>
              <p className="mt-1 font-mono text-[11px] text-observatory-muted">{job.status.id}</p>
            </div>
            <span className="font-mono text-sm tabular-nums">{Math.round(job.status.progress_pct)}%</span>
          </div>
          <div role="progressbar" aria-label="Isolation job progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={job.status.progress_pct} className="h-2 overflow-hidden rounded-full bg-observatory-border">
            <div className="h-full rounded-full bg-observatory-cyan transition-all" style={{ width: `${Math.max(0, Math.min(100, job.status.progress_pct))}%` }} />
          </div>
          {job.status.status === 'queued' || job.status.status === 'running' ? (
            <div className="flex flex-wrap items-center gap-3 text-xs text-observatory-muted">
              <span>{job.isMonitoring ? 'Status refreshes automatically.' : 'Monitoring paused; backend processing may continue.'}</span>
              {job.isMonitoring
                ? <button type="button" onClick={() => void job.stopMonitoring()} className="underline">Stop monitoring</button>
                : <button type="button" onClick={job.resumeMonitoring} className="underline">Resume monitoring</button>}
            </div>
          ) : (
            <p className="text-xs text-observatory-muted">
              {job.status.status === 'completed' ? 'The backend marked this job completed.' : job.status.error || 'The backend job failed.'}
            </p>
          )}
        </div>
      )}

      {job.queryError && (
        <div role="alert" className="rounded-lg border border-red-900/70 bg-red-950/20 p-4 text-sm text-red-300">
          {job.queryError.message}
          <button type="button" className="ml-3 underline" onClick={job.resumeMonitoring}>Retry monitoring</button>
        </div>
      )}

      {job.submit.isError && (
        <div role="alert" className="rounded-lg border border-red-900/70 bg-red-950/20 p-4 text-sm text-red-300">
          {job.submit.error.message}
          <p className="mt-2 text-xs text-red-200/80">The object-isolation job route may not be enabled yet; the synchronous endpoint remains available.</p>
        </div>
      )}

      {job.invalidCompletedResult && (
        <div role="alert" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
          The job completed, but its result does not match the current IsolateResponse schema. No measurements will be inferred.
        </div>
      )}

      {isolation.isError && (
        <div role="alert" className="rounded-lg border border-red-900/70 bg-red-950/20 p-4 text-sm text-red-300">
          {isolation.error?.message || 'Isolation request failed.'}
          <button type="button" className="ml-3 underline" onClick={() => isolation.reset()}>
            Dismiss
          </button>
        </div>
      )}

      {isolationResult && activeFrame && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Angular displacement', `${isolationResult.angular_displacement_arcsec.toFixed(4)} arcsec`],
              ['Time baseline', `${isolationResult.time_baseline_days.toFixed(2)} days`],
              ['Apparent motion', `${isolationResult.apparent_motion_arcsec_per_yr.toFixed(4)} arcsec/year`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-observatory-border p-4">
                <p className="text-xs text-observatory-muted">{label}</p>
                <p className="mt-2 font-mono text-sm">{value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-observatory-border bg-[#050a16]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-observatory-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold">{activeFrame.label}</p>
                <p className="mt-1 text-xs text-observatory-muted">
                  {activeFrame.frame.source_measurement.date_obs} · {activeFrame.frame.source_measurement.detector}
                </p>
              </div>
              <span className="font-mono text-xs text-observatory-muted">
                Frame {safeIndex + 1} / {sequence.length}
              </span>
            </div>
            <div className="flex min-h-64 items-center justify-center p-4">
              <BackendImage
                key={activeFrame.frame.isolated_png_url}
                src={resolveApiAssetUrl(activeFrame.frame.isolated_png_url)}
                alt={`${activeFrame.label}; backend isolated source ${source?.object_id ?? ''}`}
                className="max-h-[440px] w-full object-contain"
              />
            </div>
            <div className="grid gap-3 border-t border-observatory-border p-4 text-xs sm:grid-cols-3">
              <div>
                <p className="text-observatory-muted">Measured RA / Dec</p>
                <p className="mt-1 font-mono">
                  {activeFrame.frame.source_measurement.ra_deg.toFixed(6)}°, {activeFrame.frame.source_measurement.dec_deg.toFixed(6)}°
                </p>
              </div>
              <div>
                <p className="text-observatory-muted">Flux (MJy/sr)</p>
                <p className="mt-1 font-mono">{activeFrame.frame.source_measurement.flux_mjy_sr}</p>
              </div>
              <div>
                <p className="text-observatory-muted">SNR</p>
                <p className="mt-1 font-mono">{activeFrame.frame.source_measurement.snr.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-label="Previous isolated epoch"
              disabled={safeIndex === 0}
              onClick={() => {
                setPlaying(false)
                setActiveIndex(0)
              }}
              className="rounded-lg border border-observatory-border p-2 disabled:opacity-35"
            >
              <SkipBack size={16} />
            </button>
            <button
              type="button"
              aria-label={playing ? 'Pause isolated sequence' : 'Play isolated sequence'}
              onClick={() => setPlaying((value) => !value)}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
            >
              {playing ? <Pause size={15} /> : <Play size={15} />}
              {playing ? 'Pause' : 'Play sequence'}
            </button>
            <button
              type="button"
              aria-label="Next isolated epoch"
              disabled={safeIndex >= sequence.length - 1}
              onClick={() => {
                setPlaying(false)
                setActiveIndex(1)
              }}
              className="rounded-lg border border-observatory-border p-2 disabled:opacity-35"
            >
              <SkipForward size={16} />
            </button>
            <label className="flex items-center gap-2 text-xs text-observatory-muted">
              Playback speed
              <select
                value={speed}
                onChange={(event) => setSpeed(event.target.value)}
                className="rounded-lg border border-observatory-border bg-[#07101e] px-3 py-2 text-sm text-observatory-text"
              >
                <option value="0.5">0.5×</option>
                <option value="1">1×</option>
                <option value="2">2×</option>
              </select>
            </label>
          </div>
          <label className="block text-xs text-observatory-muted">
            Isolated epoch
            <input
              type="range"
              min="0"
              max={sequence.length - 1}
              step="1"
              value={safeIndex}
              onChange={(event) => {
                setPlaying(false)
                setActiveIndex(Number(event.target.value))
              }}
              aria-label="Select isolated epoch"
              className="mt-2 w-full accent-violet-400"
            />
          </label>
          <p className="text-xs text-observatory-muted">
            This sequence contains exactly the two isolated frames returned by the backend.
            No intermediate frames or synthetic motion measurements are generated.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-observatory-border p-4">
          <h3 className="font-semibold">Motion tracking</h3>
          <p className="mt-2 text-sm text-observatory-muted">
            Fixed Sky / Follow Object tracking requires a dedicated tracking
            endpoint. It is not present in the current OpenAPI contract.
          </p>
          <span className="mt-3 inline-block rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
            Backend endpoint unavailable
          </span>
        </div>

        <div className="rounded-xl border border-observatory-border p-4">
          <h3 className="font-semibold">Light curve</h3>
          <p className="mt-2 text-sm text-observatory-muted">
            Flux-versus-time measurements require a light-curve endpoint,
            which is not present in the current OpenAPI contract.
          </p>
          <span className="mt-3 inline-block rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
            Backend endpoint unavailable
          </span>
        </div>
      </div>
    </section>
  )
}
