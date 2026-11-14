import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { useIsolateObject } from '@/api/hooks/useIsolateObject'
import { clampPlaybackRate, nextIsolatedFrameIndex } from './isolationPlayerUtils'
import type { components } from '@/api/schema'

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
  const [playing, setPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState('1')
  const [activeEpoch, setActiveEpoch] = useState(0)

  useEffect(() => {
    if (!playing || !isolation.data) return

    const interval = window.setInterval(() => {
      setActiveEpoch((current) => nextIsolatedFrameIndex(current, 2))
    }, 1000 / clampPlaybackRate(Number(playbackRate)))

    return () => window.clearInterval(interval)
  }, [playing, playbackRate, isolation.data])

  const canIsolate =
    Boolean(firstFrame?.cutout_fits_url) &&
    Boolean(secondFrame?.cutout_fits_url) &&
    Boolean(source)

  function runIsolation() {
    if (!firstFrame || !secondFrame || !source) return
    setPlaying(false)
    setActiveEpoch(0)

    const early = firstFrame.mjd <= secondFrame.mjd ? firstFrame : secondFrame
    const late = firstFrame.mjd <= secondFrame.mjd ? secondFrame : firstFrame

    isolation.mutate({
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
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={runIsolation}
          disabled={!canIsolate || isolation.isPending}
          className="rounded-lg bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isolation.isPending ? 'Isolating source…' : 'Isolate across epochs'}
        </button>
        {isolation.isPending && (
          <span className="text-xs text-observatory-muted">
            Processing is performed by the backend.
          </span>
        )}
      </div>

      {isolation.isError && (
        <div className="rounded-lg border border-red-900/70 bg-red-950/20 p-4 text-sm text-red-300">
          {isolation.error?.message || 'Isolation request failed.'}
        </div>
      )}

      {isolation.data && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Angular displacement', `${isolation.data.angular_displacement_arcsec.toFixed(4)} arcsec`],
              ['Time baseline', `${isolation.data.time_baseline_days.toFixed(2)} days`],
              ['Apparent motion', `${isolation.data.apparent_motion_arcsec_per_yr.toFixed(4)} arcsec/year`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-observatory-border p-4">
                <p className="text-xs text-observatory-muted">{label}</p>
                <p className="mt-2 font-mono text-sm">{value}</p>
              </div>
            ))}
          </div>

          {(() => {
            const sequence = [
              {
                label: 'Earlier epoch',
                frame: isolation.data.early_epoch_isolated,
              },
              {
                label: 'Later epoch',
                frame: isolation.data.late_epoch_isolated,
              },
            ]
            const current = sequence[activeEpoch] ?? sequence[0]
            return (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border border-observatory-border bg-[#050a16]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-observatory-border px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">Isolated sequence player</p>
                      <p className="mt-1 text-xs text-observatory-muted">
                        {current.label} · {new Date(current.frame.source_measurement.date_obs).toLocaleString()}
                      </p>
                    </div>
                    <span className="rounded-full border border-observatory-border px-3 py-1 text-xs text-observatory-muted">
                      Frame {activeEpoch + 1} / 2
                    </span>
                  </div>
                  <div className="flex min-h-64 items-center justify-center bg-[#03060d] p-3">
                    <img
                      src={current.frame.isolated_png_url}
                      alt={`${current.label} backend-isolated source`}
                      className="max-h-[440px] w-full object-contain"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t border-observatory-border p-3">
                    <button
                      type="button"
                      aria-label="Previous isolated epoch"
                      onClick={() => {
                        setPlaying(false)
                        setActiveEpoch((index) => index === 0 ? 1 : 0)
                      }}
                      className="rounded-lg border border-observatory-border p-2 hover:border-observatory-cyan"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label={playing ? 'Pause isolated sequence' : 'Play isolated sequence'}
                      onClick={() => setPlaying((value) => !value)}
                      className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
                    >
                      {playing ? <Pause size={15} /> : <Play size={15} />}
                      {playing ? 'Pause' : 'Play'}
                    </button>
                    <button
                      type="button"
                      aria-label="Next isolated epoch"
                      onClick={() => {
                        setPlaying(false)
                        setActiveEpoch((index) => index === 0 ? 1 : 0)
                      }}
                      className="rounded-lg border border-observatory-border p-2 hover:border-observatory-cyan"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <label className="ml-1 flex items-center gap-2 text-xs text-observatory-muted">
                      Speed
                      <select
                        value={playbackRate}
                        onChange={(event) => setPlaybackRate(event.target.value)}
                        aria-label="Isolated sequence playback speed"
                        className="rounded-lg border border-observatory-border bg-[#07101e] px-3 py-2 text-sm text-observatory-text"
                      >
                        <option value="0.5">0.5×</option>
                        <option value="1">1×</option>
                        <option value="2">2×</option>
                        <option value="4">4×</option>
                      </select>
                    </label>
                    <span className="ml-auto text-xs text-observatory-muted">
                      Two returned epochs · backend cutouts only
                    </span>
                  </div>
                </div>

                <details className="rounded-xl border border-observatory-border p-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    Side-by-side epoch comparison
                  </summary>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {sequence.map(({ label, frame }) => (
                      <div key={label} className="overflow-hidden rounded-lg border border-observatory-border bg-[#050a16]">
                        <p className="border-b border-observatory-border px-3 py-2 text-xs font-semibold">
                          {label}
                        </p>
                        <img
                          src={frame.isolated_png_url}
                          alt={`${label} backend-isolated source`}
                          className="max-h-72 w-full object-contain"
                        />
                        <dl className="grid grid-cols-2 gap-2 border-t border-observatory-border p-3 text-xs">
                          <div><dt className="text-observatory-muted">RA</dt><dd className="font-mono">{frame.source_measurement.ra_deg.toFixed(6)}°</dd></div>
                          <div><dt className="text-observatory-muted">Dec</dt><dd className="font-mono">{frame.source_measurement.dec_deg.toFixed(6)}°</dd></div>
                          <div><dt className="text-observatory-muted">Flux</dt><dd>{frame.source_measurement.flux_mjy_sr.toFixed(4)} MJy/sr</dd></div>
                          <div><dt className="text-observatory-muted">SNR</dt><dd>{frame.source_measurement.snr.toFixed(2)}</dd></div>
                        </dl>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )
          })()}
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