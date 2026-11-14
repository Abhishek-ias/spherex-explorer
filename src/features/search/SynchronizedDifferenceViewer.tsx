import { useEffect, useRef, useState } from 'react'
import type { PointerEvent, WheelEvent } from 'react'
import type { components } from '@/api/schema'
import { clampDifferenceZoom, getDifferenceImageAspectRatio, nextBlinkEpoch } from './differenceViewerUtils'

type DifferenceCandidate = components['schemas']['DifferenceCandidate']

type Props = {
  earlierUrl: string
  laterUrl: string
  differenceUrl: string
  shapeNyNx: number[]
  selectedCandidate?: DifferenceCandidate
}

type PanOffset = { x: number; y: number }
type ImagePanel = { id: string; title: string; url: string }
type ComparisonMode = 'panels' | 'blink' | 'curtain'

export default function SynchronizedDifferenceViewer({
  earlierUrl,
  laterUrl,
  differenceUrl,
  shapeNyNx,
  selectedCandidate,
}: Props) {
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState<PanOffset>({ x: 0, y: 0 })
  const [mode, setMode] = useState<ComparisonMode>('panels')
  const [blinkEpoch, setBlinkEpoch] = useState<'earlier' | 'later'>('earlier')
  const [blinkPlaying, setBlinkPlaying] = useState(true)
  const [curtainPercent, setCurtainPercent] = useState(50)
  const [reducedMotion] = useState(() =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const drag = useRef<{ pointerId: number; x: number; y: number; origin: PanOffset } | null>(null)
  const aspectRatio = getDifferenceImageAspectRatio(shapeNyNx)
  const [height, width] = shapeNyNx
  const panels: ImagePanel[] = [
    { id: 'earlier', title: 'Earlier epoch', url: earlierUrl },
    { id: 'later', title: 'Later epoch', url: laterUrl },
    { id: 'difference', title: 'Difference image', url: differenceUrl },
  ]

  useEffect(() => {
    if (mode !== 'blink' || !blinkPlaying || reducedMotion) return

    const interval = window.setInterval(() => {
      setBlinkEpoch((current) => nextBlinkEpoch(current))
    }, 900)

    return () => window.clearInterval(interval)
  }, [mode, blinkPlaying, reducedMotion])

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault()
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12
    setZoom((current) => clampDifferenceZoom(current * factor))
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      origin: offset,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current
    if (!active || active.pointerId !== event.pointerId) return
    setOffset({
      x: active.origin.x + event.clientX - active.x,
      y: active.origin.y + event.clientY - active.y,
    })
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId === event.pointerId) {
      drag.current = null
    }
  }

  function resetView() {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-48 flex-1 items-center gap-3 text-xs text-observatory-muted">
          Shared zoom
          <input
            type="range"
            min="1"
            max="4"
            step="0.1"
            value={zoom}
            onChange={(event) => setZoom(clampDifferenceZoom(Number(event.target.value)))}
            aria-label="Synchronized comparison zoom"
            className="w-full accent-violet-400"
          />
          <span className="w-12 text-right font-mono">{zoom.toFixed(1)}×</span>
        </label>
        <button
          type="button"
          onClick={resetView}
          className="rounded-lg border border-observatory-border px-3 py-2 text-xs hover:border-observatory-cyan"
        >
          Reset views
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={mode === 'panels'}
          onClick={() => setMode('panels')}
          className={`rounded-lg border px-3 py-2 text-xs ${mode === 'panels' ? 'border-violet-400 bg-violet-500/10 text-violet-200' : 'border-observatory-border text-observatory-muted'}`}
        >
          Three panels
        </button>
        <button
          type="button"
          aria-pressed={mode === 'blink'}
          disabled={reducedMotion}
          onClick={() => {
            setBlinkEpoch('earlier')
            setBlinkPlaying(true)
            setMode('blink')
          }}
          className={`rounded-lg border px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40 ${mode === 'blink' ? 'border-violet-400 bg-violet-500/10 text-violet-200' : 'border-observatory-border text-observatory-muted'}`}
        >
          Blink
        </button>
        <button
          type="button"
          aria-pressed={mode === 'curtain'}
          onClick={() => setMode('curtain')}
          className={`rounded-lg border px-3 py-2 text-xs ${mode === 'curtain' ? 'border-violet-400 bg-violet-500/10 text-violet-200' : 'border-observatory-border text-observatory-muted'}`}
        >
          Curtain
        </button>
        {reducedMotion && (
          <span className="text-xs text-observatory-muted">
            Blink is disabled by your reduced-motion preference.
          </span>
        )}
      </div>

      {mode === 'panels' && (
        <div className="grid gap-3 lg:grid-cols-3">
          {panels.map((panel) => (
            <article key={panel.id} className="overflow-hidden rounded-xl border border-observatory-border bg-[#050a16]">
              <h3 className="border-b border-observatory-border px-3 py-2 text-xs font-semibold">
                {panel.title}
              </h3>
              <div
                className="relative w-full touch-none cursor-grab overflow-hidden active:cursor-grabbing"
                style={{ aspectRatio }}
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
                    transformOrigin: 'center',
                  }}
                >
                  <img
                    src={panel.url}
                    alt={panel.title}
                    draggable={false}
                    className="h-full w-full select-none object-fill"
                  />
                  {panel.id === 'difference' && selectedCandidate && (
                    <svg
                      viewBox={`0 0 ${width || 1} ${height || 1}`}
                      preserveAspectRatio="none"
                      className="pointer-events-none absolute inset-0 h-full w-full"
                      role="img"
                      aria-label={`Selected potential detection at pixel ${selectedCandidate.png_x}, ${selectedCandidate.png_y}`}
                    >
                      <circle
                        cx={selectedCandidate.png_x}
                        cy={selectedCandidate.png_y}
                        r={Math.max(width || 1, height || 1) * 0.025}
                        fill="none"
                        stroke="#facc15"
                        strokeWidth={Math.max(width || 1, height || 1) * 0.006}
                      />
                      <path
                        d={`M ${selectedCandidate.png_x - (width || 1) * 0.035} ${selectedCandidate.png_y} H ${selectedCandidate.png_x + (width || 1) * 0.035} M ${selectedCandidate.png_x} ${selectedCandidate.png_y - (height || 1) * 0.035} V ${selectedCandidate.png_y + (height || 1) * 0.035}`}
                        fill="none"
                        stroke="#facc15"
                        strokeWidth={Math.max(width || 1, height || 1) * 0.006}
                      />
                    </svg>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
  
      )}

      {mode === 'blink' && (
        <article className="overflow-hidden rounded-xl border border-observatory-border bg-[#050a16]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-observatory-border px-3 py-2">
            <h3 className="text-xs font-semibold">
              Blink comparison · {blinkEpoch === 'earlier' ? 'Earlier epoch' : 'Later epoch'}
            </h3>
            <button
              type="button"
              onClick={() => setBlinkPlaying((value) => !value)}
              className="rounded-lg border border-observatory-border px-3 py-1.5 text-xs hover:border-observatory-cyan"
            >
              {blinkPlaying ? 'Pause blink' : 'Resume blink'}
            </button>
          </div>
          <div
            className="relative w-full touch-none cursor-grab overflow-hidden active:cursor-grabbing"
            style={{ aspectRatio }}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div
              className="absolute inset-0"
              style={{
                transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
                transformOrigin: 'center',
              }}
            >
              <img
                src={blinkEpoch === 'earlier' ? earlierUrl : laterUrl}
                alt={`Blink comparison showing ${blinkEpoch} epoch`}
                draggable={false}
                className="h-full w-full select-none object-fill"
              />
            </div>
          </div>
          <p className="border-t border-observatory-border px-3 py-2 text-xs text-observatory-muted">
            Alternates between backend-returned earlier and later images. No pixel differencing is performed in the browser.
          </p>
        </article>
      )}

      {mode === 'curtain' && (
        <article className="overflow-hidden rounded-xl border border-observatory-border bg-[#050a16]">
          <h3 className="border-b border-observatory-border px-3 py-2 text-xs font-semibold">
            Curtain comparison · Earlier over later
          </h3>
          <div
            className="relative w-full touch-none cursor-grab overflow-hidden active:cursor-grabbing"
            style={{ aspectRatio }}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div
              className="absolute inset-0"
              style={{
                transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
                transformOrigin: 'center',
              }}
            >
              <img
                src={laterUrl}
                alt="Later epoch image"
                draggable={false}
                className="absolute inset-0 h-full w-full select-none object-fill"
              />
              <img
                src={earlierUrl}
                alt="Earlier epoch image revealed on the left side"
                draggable={false}
                className="absolute inset-0 h-full w-full select-none object-fill"
                style={{ clipPath: `inset(0 ${100 - curtainPercent}% 0 0)` }}
              />
              <div
                aria-hidden="true"
                className="absolute bottom-0 top-0 w-px bg-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.9)]"
                style={{ left: `${curtainPercent}%` }}
              />
            </div>
          </div>
          <label className="flex flex-wrap items-center gap-3 border-t border-observatory-border px-3 py-3 text-xs text-observatory-muted">
            Earlier epoch reveal · {curtainPercent}%
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={curtainPercent}
              onChange={(event) => setCurtainPercent(Number(event.target.value))}
              aria-label="Earlier epoch curtain reveal"
              className="min-w-36 flex-1 accent-yellow-400"
            />
          </label>
        </article>
      )}

      <p className="text-xs text-observatory-muted">
        Pan any panel or change the shared zoom to move all three views together.
        The selected candidate marker uses pixel coordinates returned for the difference image.
      </p>
    </section>
  )
}
