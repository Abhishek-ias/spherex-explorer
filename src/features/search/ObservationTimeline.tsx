import { useEffect, useMemo, useState } from 'react'
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import {
  filterTimelineByBand,
  getWavelengthBandOptions,
  type ObservationTimelineEntry,
} from './timelineUtils'

type Props = {
  entries: ObservationTimelineEntry[]
  selectedId: string
  onSelect: (observationId: string) => void
}

export default function ObservationTimeline({
  entries,
  selectedId,
  onSelect,
}: Props) {
  const [bandValue, setBandValue] = useState('all')
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState('1')

  const bandOptions = useMemo(
    () => getWavelengthBandOptions(entries),
    [entries],
  )
  const visibleEntries = useMemo(
    () => filterTimelineByBand(entries, bandValue),
    [entries, bandValue],
  )
  const selectedIndex = visibleEntries.findIndex(
    ({ frame }) => frame.obs_id === selectedId,
  )

  function selectIndex(index: number) {
    const entry = visibleEntries[index]
    if (entry) onSelect(entry.frame.obs_id)
  }

  function changeBand(nextBand: string) {
    setBandValue(nextBand)
    setPlaying(false)
    const nextEntries = filterTimelineByBand(entries, nextBand)
    if (!nextEntries.some(({ frame }) => frame.obs_id === selectedId)) {
      const firstEntry = nextEntries[0]
      if (firstEntry) onSelect(firstEntry.frame.obs_id)
    }
  }

  useEffect(() => {
    if (!playing || visibleEntries.length < 2) return

    const intervalMs = Math.max(250, 1600 / Number(speed))
    const timer = window.setInterval(() => {
      const currentIndex = visibleEntries.findIndex(
        ({ frame }) => frame.obs_id === selectedId,
      )
      const nextIndex = currentIndex < 0
        ? 0
        : (currentIndex + 1) % visibleEntries.length
      onSelect(visibleEntries[nextIndex].frame.obs_id)
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [playing, speed, visibleEntries, selectedId, onSelect])

  const previousDisabled = selectedIndex <= 0
  const nextDisabled =
    selectedIndex < 0 || selectedIndex >= visibleEntries.length - 1

  return (
    <section className="rounded-xl border border-observatory-border bg-observatory-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Observation timeline</h2>
          <p className="mt-1 text-xs text-observatory-muted">
            {visibleEntries.length} of {entries.length} frames · ordered by MJD
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-observatory-muted">
          Wavelength band
          <select
            aria-label="Filter timeline by wavelength band"
            value={bandValue}
            onChange={(event) => changeBand(event.target.value)}
            className="rounded-lg border border-observatory-border bg-[#07101e] px-3 py-2 text-sm text-observatory-text"
          >
            <option value="all">All bands</option>
            {bandOptions.map((band) => (
              <option key={band.value} value={band.value}>{band.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label="Previous observation"
          disabled={previousDisabled}
          onClick={() => selectIndex(selectedIndex - 1)}
          className="rounded-lg border border-observatory-border p-2 hover:border-observatory-cyan disabled:opacity-35"
        >
          <SkipBack size={16} />
        </button>
        <button
          type="button"
          aria-label={playing ? 'Pause timeline' : 'Play timeline'}
          disabled={visibleEntries.length < 2}
          onClick={() => setPlaying((value) => !value)}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-35"
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          aria-label="Next observation"
          disabled={nextDisabled}
          onClick={() => selectIndex(selectedIndex + 1)}
          className="rounded-lg border border-observatory-border p-2 hover:border-observatory-cyan disabled:opacity-35"
        >
          <SkipForward size={16} />
        </button>
        <label className="ml-1 flex items-center gap-2 text-xs text-observatory-muted">
          Speed
          <select
            aria-label="Timeline playback speed"
            value={speed}
            onChange={(event) => setSpeed(event.target.value)}
            className="rounded-lg border border-observatory-border bg-[#07101e] px-3 py-2 text-sm text-observatory-text"
          >
            <option value="0.5">0.5×</option>
            <option value="1">1×</option>
            <option value="2">2×</option>
            <option value="4">4×</option>
          </select>
        </label>
        <span className="ml-auto text-xs tabular-nums text-observatory-muted">
          {selectedIndex >= 0 ? selectedIndex + 1 : 0} / {visibleEntries.length}
        </span>
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
        {visibleEntries.map((entry, index) => {
          const previousEntry = visibleEntries[index - 1]
          const startsEpoch = !previousEntry || previousEntry.epochId !== entry.epochId
          const selected = entry.frame.obs_id === selectedId

          return (
            <div key={entry.frame.obs_id} className="min-w-36">
              {startsEpoch && (
                <p className="mb-2 truncate text-[10px] font-semibold uppercase tracking-wider text-observatory-cyan">
                  {entry.epochId}
                </p>
              )}
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(entry.frame.obs_id)}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  selected
                    ? 'border-violet-400 bg-violet-500/15'
                    : 'border-observatory-border hover:border-observatory-cyan'
                }`}
              >
                <p className="text-xs text-observatory-muted">Frame {index + 1}</p>
                <p className="mt-1 text-sm font-semibold">
                  {new Date(entry.frame.date_iso).toLocaleDateString()}
                </p>
                <p className="mt-1 font-mono text-[10px] text-observatory-muted">
                  {entry.frame.detector}
                </p>
                <p className="mt-2 font-mono text-[10px] text-observatory-muted">
                  {entry.frame.em_min_um.toFixed(3)}–{entry.frame.em_max_um.toFixed(3)} μm
                </p>
              </button>
            </div>
          )
        })}
      </div>

      {visibleEntries.length === 0 && (
        <p className="mt-4 text-sm text-observatory-muted">
          No frames are available in this wavelength band.
        </p>
      )}
    </section>
  )
}
