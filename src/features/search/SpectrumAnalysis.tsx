import { lazy, Suspense, useMemo, useState } from 'react'
import { useSpectrumCompare } from '@/api/hooks/useSpectrumCompare'
import { getChannelCoverage, getFlaggedRawPoints } from './spectrumUtils'

const SpectrumCharts = lazy(() => import('./SpectrumCharts'))

type Props = {
  ra: number
  dec: number
  epochs: string[]
}

export default function SpectrumAnalysis({ ra, dec, epochs }: Props) {
  const [earlier, setEarlier] = useState(epochs[0] ?? '')
  const [later, setLater] = useState(epochs[1] ?? '')
  const spectrum = useSpectrumCompare()

  const validEarlier = epochs.includes(earlier) ? earlier : epochs[0] ?? ''
  const validLater = epochs.includes(later) ? later : epochs[1] ?? ''

  const summaries = useMemo(() => {
    if (!spectrum.data) return null
    const earlierCoverage = getChannelCoverage(spectrum.data.earlier_epoch)
    const laterCoverage = spectrum.data.later_epoch
      ? getChannelCoverage(spectrum.data.later_epoch)
      : null
    const flagged = [
      ...getFlaggedRawPoints(spectrum.data.earlier_epoch.raw_points).map((point) => ({
        epochId: spectrum.data?.earlier_epoch.epoch_id ?? 'Earlier',
        point,
      })),
      ...(spectrum.data.later_epoch
        ? getFlaggedRawPoints(spectrum.data.later_epoch.raw_points).map((point) => ({
            epochId: spectrum.data?.later_epoch?.epoch_id ?? 'Later',
            point,
          }))
        : []),
    ]
    return { earlierCoverage, laterCoverage, flagged }
  }, [spectrum.data])

  function exportCsv() {
    const result = spectrum.data
    if (!result) return

    const rows = [
      ['channel', 'wavelength_um', 'earlier_flux', 'earlier_flux_err', 'later_flux', 'later_flux_err', 'delta_flux', 'comparable'],
      ...result.difference_spectrum_102.map((point) => {
        const before = result.earlier_epoch.channels_102.find((item) => item.channel === point.channel)
        const after = result.later_epoch?.channels_102.find((item) => item.channel === point.channel)

        return [
          point.channel,
          point.wavelength_um,
          before?.flux ?? '',
          before?.flux_err ?? '',
          after?.flux ?? '',
          after?.flux_err ?? '',
          point.delta_flux ?? '',
          point.comparable,
        ]
      }),
    ]

    const csv = rows.map((row) =>
      row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','),
    ).join('\n')

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'spherex-spectrum-comparison.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section id="spectrum-analysis" className="space-y-5 rounded-2xl border border-observatory-border bg-observatory-surface p-5 sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-observatory-cyan">
          Phase 4 · Analysis
        </p>
        <h2 className="mt-2 font-heading text-2xl font-semibold">
          Spectral analysis
        </h2>
        <p className="mt-2 text-sm text-observatory-muted">
          Compare backend-provided 102-channel spectra across survey epochs.
        </p>
      </div>

      {epochs.length < 2 ? (
        <div className="rounded-xl border border-dashed border-observatory-border p-5 text-sm text-observatory-muted">
          At least two survey epochs are required for spectral comparison.
          {epochs.length === 1 && (
            <p className="mt-2">Available epoch: {epochs[0]}</p>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <label className="text-xs text-observatory-muted">
              Earlier epoch
              <select
                value={validEarlier}
                onChange={(event) => setEarlier(event.target.value)}
                className="mt-2 w-full rounded-lg border border-observatory-border bg-[#07101e] px-3 py-3 text-sm text-observatory-text"
              >
                {epochs.map((epoch) => (
                  <option key={epoch} value={epoch}>{epoch}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-observatory-muted">
              Later epoch
              <select
                value={validLater}
                onChange={(event) => setLater(event.target.value)}
                className="mt-2 w-full rounded-lg border border-observatory-border bg-[#07101e] px-3 py-3 text-sm text-observatory-text"
              >
                {epochs.map((epoch) => (
                  <option key={epoch} value={epoch}>{epoch}</option>
                ))}
              </select>
            </label>
            <button
              disabled={
                spectrum.isPending ||
                !validEarlier ||
                !validLater ||
                validEarlier === validLater
              }
              onClick={() => spectrum.mutate({
                ra,
                dec,
                earlier_epoch: validEarlier,
                later_epoch: validLater,
                max_exposures_per_epoch: 36,
              })}
              className="self-end rounded-lg bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {spectrum.isPending ? 'Comparing…' : 'Compare spectra'}
            </button>
          </div>

          {validEarlier === validLater && (
            <p className="text-xs text-amber-300">Select two different epochs.</p>
          )}

          {spectrum.isError && (
            <div className="rounded-lg border border-red-900/70 bg-red-950/20 p-4 text-sm text-red-300">
              {spectrum.error.message}
              <button
                onClick={() => spectrum.reset()}
                className="ml-3 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {spectrum.data && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-observatory-border p-4">
                  <p className="text-xs text-observatory-muted">
                    Earlier epoch · {spectrum.data.earlier_epoch.epoch_id}
                  </p>
                  <p className="mt-2 font-heading text-xl font-semibold">
                    {summaries?.earlierCoverage.available ?? 0} / 102 channels available
                  </p>
                  <p className="mt-1 text-xs text-observatory-muted">
                    {summaries?.earlierCoverage.wavelengthMinUm !== null &&
                    summaries?.earlierCoverage.wavelengthMaxUm !== null
                      ? `${summaries?.earlierCoverage.wavelengthMinUm?.toFixed(3)}–${summaries?.earlierCoverage.wavelengthMaxUm?.toFixed(3)} μm coverage`
                      : 'No measured wavelength coverage returned'}
                  </p>
                  <p className="mt-1 text-xs text-observatory-muted">
                    {spectrum.data.earlier_epoch.raw_points.length} raw measurements · {getFlaggedRawPoints(spectrum.data.earlier_epoch.raw_points).length} non-zero quality flags
                  </p>
                </div>
                {spectrum.data.later_epoch && (
                  <div className="rounded-xl border border-observatory-border p-4">
                    <p className="text-xs text-observatory-muted">
                      Later epoch · {spectrum.data.later_epoch.epoch_id}
                    </p>
                    <p className="mt-2 font-heading text-xl font-semibold">
                      {summaries?.laterCoverage?.available ?? 0} / 102 channels available
                    </p>
                    <p className="mt-1 text-xs text-observatory-muted">
                      {summaries?.laterCoverage?.wavelengthMinUm !== null &&
                      summaries?.laterCoverage?.wavelengthMaxUm !== null
                        ? `${summaries?.laterCoverage?.wavelengthMinUm?.toFixed(3)}–${summaries?.laterCoverage?.wavelengthMaxUm?.toFixed(3)} μm coverage`
                        : 'No measured wavelength coverage returned'}
                    </p>
                    <p className="mt-1 text-xs text-observatory-muted">
                      {spectrum.data.later_epoch.raw_points.length} raw measurements · {getFlaggedRawPoints(spectrum.data.later_epoch.raw_points).length} non-zero quality flags
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={exportCsv}
                  className="rounded-lg border border-observatory-border px-4 py-2 text-xs hover:border-observatory-cyan"
                >
                  Export CSV
                </button>
              </div>

              <p className="text-xs text-amber-300">
                The API schema does not specify a flux unit. Values are displayed
                as returned; no unit conversion is applied.
              </p>

              <Suspense fallback={
                <div className="h-72 animate-pulse rounded-xl bg-[#080f1c]" />
              }>
                <SpectrumCharts result={spectrum.data} />
              </Suspense>

              <details className="overflow-hidden rounded-xl border border-observatory-border">
                <summary className="cursor-pointer bg-[#080f1c] px-4 py-3 text-sm font-semibold">
                  Quality-flagged raw measurements ({summaries?.flagged.length ?? 0})
                </summary>
                <p className="px-4 pt-3 text-xs text-observatory-muted">
                  Numeric quality flags are shown exactly as returned by the backend.
                  The current API schema does not define a flag-code legend.
                </p>
                {summaries?.flagged.length ? (
                  <div className="max-h-80 overflow-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-observatory-surface text-observatory-muted">
                        <tr>
                          <th className="p-3">Epoch</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Detector</th>
                          <th className="p-3">Wavelength (μm)</th>
                          <th className="p-3">Flux</th>
                          <th className="p-3">SNR</th>
                          <th className="p-3">Quality flag</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaries.flagged.map(({ epochId, point }, index) => (
                          <tr key={`${epochId}-${point.obs_id}-${point.mjd}-${point.wavelength_um}-${index}`} className="border-t border-observatory-border">
                            <td className="p-3">{epochId}</td>
                            <td className="p-3 whitespace-nowrap">{new Date(point.date_iso).toLocaleDateString()}</td>
                            <td className="p-3 font-mono">{point.detector}</td>
                            <td className="p-3 font-mono">{point.wavelength_um.toFixed(4)}</td>
                            <td className="p-3 font-mono">{point.flux}</td>
                            <td className="p-3 font-mono">{point.snr.toFixed(2)}</td>
                            <td className="p-3"><span className="rounded bg-amber-500/10 px-2 py-1 text-amber-300">{point.quality_flag}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="p-4 text-sm text-observatory-muted">
                    No non-zero quality flags were returned for these raw measurements.
                  </p>
                )}
              </details>
            </>
          )}
        </>
      )}
    </section>
  )
}