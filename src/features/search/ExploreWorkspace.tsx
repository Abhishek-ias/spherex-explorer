import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSearchObservations } from '@/api/hooks/useSearchObservations'
import { useIdentifyObject } from '@/api/hooks/useIdentifyObject'
import { useCatalogOverlays } from '@/api/hooks/useCatalogOverlays'
import SkyViewer, { type OverlayMarker } from './SkyViewer'
import SpectrumAnalysis from './SpectrumAnalysis'
import DifferenceAnalysis from './DifferenceAnalysis'
import TrackingIsolation from './TrackingIsolation'
import ShareControls from './ShareControls'
import AladinContextMap from './AladinContextMap'
import WebMExport from './WebMExport'
import ObservationTimeline from './ObservationTimeline'
import { searchParamsSchema } from './searchParams'
import PanelErrorBoundary from './PanelErrorBoundary'
import { useExplorerStore } from '@/store/explorerStore'

function readOpacityParameter(params: URLSearchParams, key: string): number {
  const value = params.get(key)
  if (value === null) return 80
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 80
  return Math.min(100, Math.max(10, Math.round(parsed)))
}

export default function ExploreWorkspace() {
  const [params, setParams] = useSearchParams()
  const urlSelectedFrameId = params.get('frame') ?? ''
  const urlCompareFrameId = params.get('compare') ?? ''
  const urlTimelineBand = params.get('band') ?? 'all'
  const urlLayers = params.get('layers') ?? ''
  const urlGaiaOpacity = readOpacityParameter(params, 'gaiaOpacity')
  const urlWiseOpacity = readOpacityParameter(params, 'wiseOpacity')
  const uiStateKey = JSON.stringify([
    urlSelectedFrameId,
    urlCompareFrameId,
    urlTimelineBand,
    urlLayers,
    urlGaiaOpacity,
    urlWiseOpacity,
  ])

  const hydrateFromUrl = useExplorerStore((state) => state.hydrateFromUrl)
  const hydrationKey = useExplorerStore((state) => state.hydrationKey)
  const uiStateHydrated = hydrationKey === uiStateKey
  const selectedId = useExplorerStore((state) => state.selectedFrameId)
  const setSelectedId = useExplorerStore((state) => state.setSelectedFrameId)
  const compareId = useExplorerStore((state) => state.compareFrameId)
  const setCompareId = useExplorerStore((state) => state.setCompareFrameId)
  const timelineBand = useExplorerStore((state) => state.timelineBand)
  const setTimelineBand = useExplorerStore((state) => state.setTimelineBand)
  const selectedOverlay = useExplorerStore((state) => state.selectedOverlay)
  const setSelectedOverlay = useExplorerStore((state) => state.setSelectedOverlay)
  const gaiaVisible = useExplorerStore((state) => state.gaiaVisible)
  const setGaiaVisible = useExplorerStore((state) => state.setGaiaVisible)
  const wiseVisible = useExplorerStore((state) => state.wiseVisible)
  const setWiseVisible = useExplorerStore((state) => state.setWiseVisible)
  const gaiaOpacity = useExplorerStore((state) => state.gaiaOpacity)
  const setGaiaOpacity = useExplorerStore((state) => state.setGaiaOpacity)
  const wiseOpacity = useExplorerStore((state) => state.wiseOpacity)
  const setWiseOpacity = useExplorerStore((state) => state.setWiseOpacity)

  const parsed = searchParamsSchema.safeParse({
    ra: params.get('ra'),
    dec: params.get('dec'),
    fov: params.get('fov'),
  })

  const ra = parsed.success ? parsed.data.ra : undefined
  const dec = parsed.success ? parsed.data.dec : undefined
  const fov = parsed.success ? parsed.data.fov : undefined

  const { data, isPending, isError, error, refetch } =
    useSearchObservations(ra, dec, fov)

  const identify = useIdentifyObject()
  const overlays = useCatalogOverlays()
  const identifyAbortRef = useRef<AbortController | null>(null)

  const [identifyError, setIdentifyError] = useState('')
  const [pendingSelection, setPendingSelection] = useState<{ x: number; y: number } | null>(null)

  const timelineEntries = useMemo(
    () => data?.epochs.flatMap((epoch) =>
      epoch.observations.map((frame) => ({
        frame,
        epochId: epoch.epoch_id,
      })),
    ).sort((a, b) => a.frame.mjd - b.frame.mjd) ?? [],
    [data],
  )
  const frames = useMemo(
    () => timelineEntries.map(({ frame }) => frame),
    [timelineEntries],
  )

  const selectedFrame = frames.find((frame) => frame.obs_id === selectedId) ?? frames[0]



  const comparableFrames = selectedFrame
    ? frames.filter((frame) => selectedFrame.comparable_with.includes(frame.obs_id))
    : []

  const compareFrame = comparableFrames.find((frame) => frame.obs_id === compareId) ?? comparableFrames[0]
  const selectedFrameId = selectedFrame?.obs_id
  const compareFrameId = compareFrame?.obs_id

  const selectFrame = useCallback((observationId: string) => {
    identifyAbortRef.current?.abort()
    identifyAbortRef.current = null
    setPendingSelection(null)
    identify.reset()
    setIdentifyError('')
    setSelectedId(observationId)
  }, [identify.reset, setSelectedId])

  useEffect(() => {
    hydrateFromUrl(uiStateKey, {
      selectedFrameId: urlSelectedFrameId,
      compareFrameId: urlCompareFrameId,
      timelineBand: urlTimelineBand,
      gaiaVisible: urlLayers.split(',').includes('gaia'),
      wiseVisible: urlLayers.split(',').includes('wise'),
      gaiaOpacity: urlGaiaOpacity,
      wiseOpacity: urlWiseOpacity,
    })
  }, [
    hydrateFromUrl,
    uiStateKey,
    urlSelectedFrameId,
    urlCompareFrameId,
    urlTimelineBand,
    urlLayers,
    urlGaiaOpacity,
    urlWiseOpacity,
  ])

  useEffect(() => () => {
    identifyAbortRef.current?.abort()
  }, [])

  useEffect(() => {
    function handleLayerShortcut(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target
      if (target instanceof HTMLElement && (
        target.isContentEditable ||
        target.closest('input, textarea, select, button, [contenteditable="true"]')
      )) return

      const key = event.key.toLowerCase()
      if (key === 'g') setGaiaVisible((visible) => !visible)
      if (key === 'w') setWiseVisible((visible) => !visible)
    }

    window.addEventListener('keydown', handleLayerShortcut)
    return () => window.removeEventListener('keydown', handleLayerShortcut)
  }, [])

  useEffect(() => {
    if (!uiStateHydrated) return

    const next = new URLSearchParams(params)

    if (selectedFrameId) next.set('frame', selectedFrameId)
    else next.delete('frame')

    if (compareFrameId) next.set('compare', compareFrameId)
    else next.delete('compare')

    if (timelineBand === 'all') next.delete('band')
    else next.set('band', timelineBand)

    const layers = [
      ...(gaiaVisible ? ['gaia'] : []),
      ...(wiseVisible ? ['wise'] : []),
    ]

    if (layers.length) next.set('layers', layers.join(','))
    else next.delete('layers')

    next.set('gaiaOpacity', String(gaiaOpacity))
    next.set('wiseOpacity', String(wiseOpacity))

    if (identify.data?.object_id) next.set('obj', identify.data.object_id)

    if (next.toString() !== params.toString()) {
      setParams(next, { replace: true })
    }
  }, [
    selectedFrameId,
    compareFrameId,
    gaiaVisible,
    wiseVisible,
    timelineBand,
    gaiaOpacity,
    wiseOpacity,
    identify.data?.object_id,
    params,
    setParams,
    uiStateHydrated,
  ])

  const overlayMarkers = useMemo<OverlayMarker[]>(() => {
    if (!selectedFrameId || !overlays.data) return []

    const gaia = gaiaVisible
      ? overlays.data.gaia_dr3_sources.flatMap((source) => {
          const point = source.frame_px[selectedFrameId] ?? source.frame_px.default
          return point ? [{
            id: source.source_id,
            x: point.x,
            y: point.y,
            kind: 'gaia' as const,
            opacity: gaiaOpacity / 100,
          }] : []
        })
      : []

    const wise = wiseVisible
      ? overlays.data.wise_sources.flatMap((source) => {
          const point = source.frame_px[selectedFrameId] ?? source.frame_px.default
          return point ? [{
            id: source.designation,
            x: point.x,
            y: point.y,
            kind: 'wise' as const,
            opacity: wiseOpacity / 100,
          }] : []
        })
      : []

    return [...gaia, ...wise]
  }, [selectedFrameId, overlays.data, gaiaVisible, wiseVisible, gaiaOpacity, wiseOpacity])

  function identifyAt(x: number, y: number, width: number, height: number) {
    if (ra === undefined || dec === undefined || fov === undefined || !selectedFrame) return
    if (!selectedFrame.cutout_fits_url) {
      setIdentifyError('This observation does not provide a cutout FITS URL.')
      return
    }

    identifyAbortRef.current?.abort()
    identify.reset()
    const controller = new AbortController()
    identifyAbortRef.current = controller
    setPendingSelection({
      x: Math.min(1, Math.max(0, x / width)),
      y: Math.min(1, Math.max(0, y / height)),
    })
    setIdentifyError('')
    identify.mutate({
      request: {
        cutout_fits_url: selectedFrame.cutout_fits_url,
        click_x: x,
        click_y: y,
        rendered_width: width,
        rendered_height: height,
      },
      signal: controller.signal,
    }, {
      onSettled: () => {
        if (identifyAbortRef.current === controller) {
          identifyAbortRef.current = null
          setPendingSelection(null)
        }
      },
    })
  }

  function loadOverlays() {
    if (ra === undefined || dec === undefined || fov === undefined || !selectedFrame) return

    overlays.mutate({
      cutout_fits_url: selectedFrame.cutout_fits_url,
      ra,
      dec,
      fov_arcmin: fov,
      frame_cutout_urls: Object.fromEntries(
        frames.map((frame) => [frame.obs_id, frame.cutout_fits_url]),
      ),
    })
  }

  if (!parsed.success) {
    return (
      <section
        role="alert"
        className="max-w-2xl rounded-xl border border-amber-500/30 bg-observatory-surface p-7"
      >
        <p className="font-mono text-xs uppercase tracking-widest text-amber-300">
          Invalid shared search
        </p>
        <h1 className="mt-3 font-heading text-2xl font-semibold">
          This search link contains invalid coordinates or settings
        </h1>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-observatory-muted">
          {parsed.error.issues.map((issue, index) => (
            <li key={index}>
              {issue.path.length ? `${String(issue.path[0]).toUpperCase()}: ` : ''}
              {issue.message}
            </li>
          ))}
        </ul>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
        >
          Return to coordinate search
        </Link>
      </section>
    )
  }

  if (isPending) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-800" />
        <div className="h-[430px] animate-pulse rounded-2xl bg-slate-900" />
        <p className="text-sm text-observatory-muted">Searching SPHEREx observationsÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦</p>
      </div>
    )
  }

  if (isError) {
    return (
      <section className="rounded-xl border border-red-900/70 bg-red-950/20 p-7">
        <h1 className="text-xl font-semibold text-red-300">Search failed</h1>
        <p className="mt-2 text-sm text-observatory-muted">{error.message}</p>
        <button onClick={() => void refetch()}
          className="mt-4 rounded-lg border border-observatory-border px-4 py-2 text-sm">Retry search</button>
        <Link to="/" className="ml-4 text-sm text-observatory-cyan underline">Back home</Link>
      </section>
    )
  }

  if (!data || frames.length === 0) {
    return (
      <section className="rounded-2xl border border-observatory-border bg-observatory-surface p-8">
        {import.meta.env.VITE_USE_MOCKS === 'true' && (
          <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs text-violet-300">DEMO DATA</span>
        )}
        <h1 className="mt-5 font-heading text-3xl font-semibold">No observations found</h1>
        <p className="mt-3 max-w-2xl leading-7 text-observatory-muted">
          The backend returned no observation frames for these coordinates and field of view.
          No detection or measurement is being claimed.
        </p>
        <Link to="/" className="mt-7 inline-block text-sm text-observatory-cyan underline">Search another position</Link>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-observatory-cyan">Sky workspace</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold">Observation Explorer</h1>
          <p className="mt-2 text-sm text-observatory-muted">
            {data.total_observations} observations ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {data.epochs.length} epochs ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· FOV {fov} arcmin
          </p>
        </div>
        {import.meta.env.VITE_USE_MOCKS === 'true' && (
          <span className="rounded-full bg-violet-500/15 px-3 py-1.5 text-xs text-violet-300">DEMO DATA</span>
        )}
      </div>

      <div className="flex justify-end"><ShareControls /></div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <PanelErrorBoundary panelName="Sky viewer">
            <SkyViewer
              imageUrl={selectedFrame.preview_png_url}
              targetPx={selectedFrame.target_px}
              title={selectedFrame.obs_id}
              onIdentify={identifyAt}
              overlayMarkers={overlayMarkers}
              pendingSelection={pendingSelection ?? undefined}
              selectedObject={identify.data?.target_px}
              onOverlaySelect={(id, kind) => setSelectedOverlay({ id, kind })}
            />
          </PanelErrorBoundary>

          <PanelErrorBoundary panelName="Observation timeline">
            <ObservationTimeline
              entries={timelineEntries}
              selectedId={selectedFrame.obs_id}
              bandValue={timelineBand}
              onBandChange={setTimelineBand}
              onSelect={selectFrame}
            />
          </PanelErrorBoundary>

          <PanelErrorBoundary panelName="WebM export">
            <WebMExport
              frames={frames.map((frame) => ({
                obsId: frame.obs_id,
                dateIso: frame.date_iso,
                imageUrl: frame.preview_png_url,
              }))}
            />
          </PanelErrorBoundary>

          <PanelErrorBoundary panelName="Spectral analysis">
            <SpectrumAnalysis
              ra={parsed.data.ra}
              dec={parsed.data.dec}
              epochs={data.epochs.map((epoch) => epoch.epoch_id)}
            />
          </PanelErrorBoundary>
          <PanelErrorBoundary panelName="Difference imaging">
            <DifferenceAnalysis
              key={`${selectedFrame.obs_id}-${compareFrame?.obs_id ?? 'none'}`}
              ra={parsed.data.ra}
              dec={parsed.data.dec}
              firstFrame={selectedFrame}
              secondFrame={compareFrame}
            />
          </PanelErrorBoundary>
          <PanelErrorBoundary panelName="Tracking and isolation">
            <TrackingIsolation
              key={`${selectedFrame.obs_id}-${compareFrame?.obs_id ?? 'none'}-${identify.data?.object_id ?? 'unselected'}`}
              firstFrame={selectedFrame}
              secondFrame={compareFrame}
              source={identify.data}
            />
          </PanelErrorBoundary>

          <section id="object-identification" className="rounded-xl border border-observatory-border bg-observatory-surface p-5">
            <h2 className="font-semibold">Object identification</h2>
            <p className="mt-1 text-xs text-observatory-muted">
              Click a source in the image to request centroiding from the backend.
            </p>
            {identify.isPending && <p className="mt-4 text-sm text-observatory-cyan">Identifying sourceÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦</p>}
            {(identifyError || identify.isError) && (
              <p className="mt-4 text-sm text-red-400">
                {identifyError || identify.error?.message || 'Object identification failed.'}
              </p>
            )}
            {identify.data && (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    identify.data.is_usable
                      ? 'bg-emerald-500/10 text-emerald-300'
                      : 'bg-amber-500/10 text-amber-300'
                  }`}>
                    {identify.data.is_usable ? 'Backend marked usable' : 'Backend marked not usable'}
                  </span>
                  <span className="rounded-full border border-observatory-border px-3 py-1 text-xs text-observatory-muted">
                    Quality flag: {identify.data.quality_flag}
                  </span>
                </div>
                <p className="text-xs text-observatory-muted">
                  A Gaia/SIMBAD/known-object match label is not provided by the current identification response.
                </p>
                <nav aria-label="Selected object actions" className="flex flex-wrap gap-2">
                  <a href="#spectrum-analysis" className="rounded-lg border border-observatory-border px-3 py-2 text-xs hover:border-observatory-cyan">Analyse spectrum</a>
                  <a href="#difference-analysis" className="rounded-lg border border-observatory-border px-3 py-2 text-xs hover:border-observatory-cyan">Compare observations</a>
                  <a href="#tracking-isolation" className="rounded-lg border border-observatory-border px-3 py-2 text-xs hover:border-observatory-cyan">Track & isolate</a>
                  <a href="#catalogue-overlays" className="rounded-lg border border-observatory-border px-3 py-2 text-xs hover:border-observatory-cyan">Catalogue context</a>
                </nav>
                <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Object ID', identify.data.object_id],
                  ['RA', `${identify.data.ra_deg.toFixed(6)}ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â° (${identify.data.ra_hms})`],
                  ['Dec', `${identify.data.dec_deg.toFixed(6)}ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â° (${identify.data.dec_dms})`],
                  ['Detector', identify.data.detector],
                  ['Flux', `${identify.data.flux_mjy_sr} MJy/sr`],
                  ['Flux error', `${identify.data.flux_err_mjy_sr} MJy/sr`],
                  ['SNR', identify.data.snr.toFixed(2)],
                  ['Quality flag', String(identify.data.quality_flag)],
                  ['Usable', identify.data.is_usable ? 'Yes' : 'No'],
                  ['Observation date', identify.data.date_obs],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-observatory-border p-3">
                    <p className="text-xs text-observatory-muted">{label}</p>
                    <p className="mt-1 break-all font-mono text-sm">{value}</p>
                  </div>
                ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-xl border border-observatory-border bg-observatory-surface p-5">
            <h2 className="font-semibold">Target position</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-observatory-muted">RA</dt><dd className="font-mono">{data.query_ra_deg.toFixed(6)}ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-observatory-muted">Dec</dt><dd className="font-mono">{data.query_dec_deg.toFixed(6)}ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-observatory-muted">FOV</dt><dd>{data.fov_arcmin} arcmin</dd></div>
            </dl>
          </section>

          <PanelErrorBoundary panelName="Aladin context map">
            <AladinContextMap
              ra={data.query_ra_deg}
              dec={data.query_dec_deg}
              fovArcmin={data.fov_arcmin}
            />
          </PanelErrorBoundary>

          <section className="rounded-xl border border-observatory-border bg-observatory-surface p-5">
            <h2 className="font-semibold">Frame metadata</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-xs text-observatory-muted">Observation ID</dt><dd className="mt-1 break-all font-mono text-xs">{selectedFrame.obs_id}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-observatory-muted">Detector</dt><dd>{selectedFrame.detector}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-observatory-muted">Date (UTC)</dt><dd>{new Date(selectedFrame.date_iso).toLocaleDateString()}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-observatory-muted">MJD</dt><dd className="font-mono">{selectedFrame.mjd.toFixed(3)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-observatory-muted">Wavelength</dt><dd>{selectedFrame.em_min_um}ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“{selectedFrame.em_max_um} ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¼m</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-observatory-muted">Release</dt><dd>{selectedFrame.release}</dd></div>
            </dl>
          </section>

          <section className="rounded-xl border border-observatory-border bg-observatory-surface p-5">
            <h2 className="font-semibold">Comparable frame</h2>
            {comparableFrames.length > 0 ? (
              <>
                <select value={compareFrame?.obs_id ?? ""} onChange={(event) => setCompareId(event.target.value)}
                  className="mt-3 w-full rounded-lg border border-observatory-border bg-[#07101e] px-3 py-2 text-sm">
                  {comparableFrames.map((frame) => <option key={frame.obs_id} value={frame.obs_id}>{frame.obs_id}</option>)}
                </select>
                {compareFrame && <p className="mt-3 text-xs text-observatory-muted">{new Date(compareFrame.date_iso).toLocaleDateString()} ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {compareFrame.detector}</p>}
              </>
            ) : (
              <p className="mt-3 text-sm text-observatory-muted">No comparable frames supplied for this observation.</p>
            )}
          </section>

          <section id="catalogue-overlays" className="rounded-xl border border-observatory-border bg-observatory-surface p-5">
            <h2 className="font-semibold">Catalogue overlays</h2>
            <p className="mt-2 text-xs leading-5 text-observatory-muted">
              Gaia DR3 and AllWISE source positions are supplied by the backend for each observation frame.
            </p>
            <button
              onClick={loadOverlays}
              disabled={overlays.isPending || !selectedFrame.cutout_fits_url}
              className="mt-4 w-full rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-40"
            >
              {overlays.isPending ? 'Loading cataloguesÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦' : 'Load Gaia & WISE'}
            </button>

            {overlays.isError && (
              <p className="mt-3 text-xs text-red-300">
                {overlays.error?.message || 'Catalogue request failed.'}
              </p>
            )}

            {overlays.data && (
              <div className="mt-4 space-y-4">
                <label className="flex items-center justify-between text-sm">
                  <span>Gaia DR3 ({overlays.data.gaia_dr3_sources.length})</span>
                  <input type="checkbox" checked={gaiaVisible}
                    onChange={(event) => setGaiaVisible(event.target.checked)}
                    aria-label="Show Gaia DR3 overlay" />
                </label>
                <label className="flex items-center justify-between text-sm">
                  <span>WISE ({overlays.data.wise_sources.length})</span>
                  <input type="checkbox" checked={wiseVisible}
                    onChange={(event) => setWiseVisible(event.target.checked)}
                    aria-label="Show WISE overlay" />
                </label>
                <div className="space-y-3 rounded-lg border border-observatory-border p-3">
                  <label className="block text-xs text-observatory-muted">
                    Gaia marker opacity · {gaiaOpacity}%
                    <input type="range" min="10" max="100" step="5" value={gaiaOpacity}
                      disabled={!gaiaVisible}
                      onChange={(event) => setGaiaOpacity(Number(event.target.value))}
                      aria-label="Gaia marker opacity"
                      className="mt-2 w-full accent-blue-400 disabled:opacity-40" />
                  </label>
                  <label className="block text-xs text-observatory-muted">
                    WISE marker opacity · {wiseOpacity}%
                    <input type="range" min="10" max="100" step="5" value={wiseOpacity}
                      disabled={!wiseVisible}
                      onChange={(event) => setWiseOpacity(Number(event.target.value))}
                      aria-label="WISE marker opacity"
                      className="mt-2 w-full accent-amber-400 disabled:opacity-40" />
                  </label>
                </div>
                <div className="text-xs text-observatory-muted">
                  CSA NEOSSat observations: {overlays.data.csa_neossat_observations.length}
                </div>
                {selectedOverlay?.kind === 'gaia' && (() => {
                  const source = overlays.data?.gaia_dr3_sources.find(
                    (item) => item.source_id === selectedOverlay.id,
                  )
                  if (!source) return null
                  return (
                    <div role="status" aria-label="Selected Gaia source details" className="rounded-xl border border-blue-400/40 bg-blue-500/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-blue-300">Selected Gaia DR3 source</h3>
                        <button type="button" onClick={() => setSelectedOverlay(null)} className="text-xs text-observatory-muted underline">Close</button>
                      </div>
                      <p className="mt-2 break-all font-mono text-xs">{source.source_id}</p>
                      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div><dt className="text-observatory-muted">RA</dt><dd>{source.ra_deg.toFixed(6)}°</dd></div>
                        <div><dt className="text-observatory-muted">Dec</dt><dd>{source.dec_deg.toFixed(6)}°</dd></div>
                        <div><dt className="text-observatory-muted">PMRA</dt><dd>{source.pmra_mas_yr} mas/yr</dd></div>
                        <div><dt className="text-observatory-muted">PMDec</dt><dd>{source.pmdec_mas_yr} mas/yr</dd></div>
                        <div><dt className="text-observatory-muted">Parallax</dt><dd>{source.parallax_mas ?? 'Not supplied'} mas</dd></div>
                        <div><dt className="text-observatory-muted">G magnitude</dt><dd>{source.g_mag ?? 'Not supplied'}</dd></div>
                        <div><dt className="text-observatory-muted">BP − RP</dt><dd>{source.bp_rp ?? 'Not supplied'}</dd></div>
                        <div><dt className="text-observatory-muted">Reference epoch</dt><dd>{source.ref_epoch}</dd></div>
                      </dl>
                    </div>
                  )
                })()}
                {selectedOverlay?.kind === 'wise' && (() => {
                  const source = overlays.data?.wise_sources.find(
                    (item) => item.designation === selectedOverlay.id,
                  )
                  if (!source) return null
                  return (
                    <div role="status" aria-label="Selected WISE source details" className="rounded-xl border border-amber-400/40 bg-amber-500/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-amber-300">Selected AllWISE source</h3>
                        <button type="button" onClick={() => setSelectedOverlay(null)} className="text-xs text-observatory-muted underline">Close</button>
                      </div>
                      <p className="mt-2 break-all font-mono text-xs">{source.designation}</p>
                      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div><dt className="text-observatory-muted">RA</dt><dd>{source.ra_deg.toFixed(6)}°</dd></div>
                        <div><dt className="text-observatory-muted">Dec</dt><dd>{source.dec_deg.toFixed(6)}°</dd></div>
                        <div><dt className="text-observatory-muted">W1 magnitude</dt><dd>{source.w1_mag ?? 'Not supplied'}</dd></div>
                        <div><dt className="text-observatory-muted">W2 magnitude</dt><dd>{source.w2_mag ?? 'Not supplied'}</dd></div>
                      </dl>
                    </div>
                  )
                })()}

                <p className="text-xs leading-5 text-observatory-muted">
                  Not every SPHEREx source has a catalogue counterpart. Catalogue epochs,
                  resolutions and wavelength ranges differ.
                </p>
                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {gaiaVisible && overlays.data.gaia_dr3_sources.map((source) => (
                    <details key={source.source_id} className="rounded-lg border border-observatory-border p-3 text-xs">
                      <summary className="cursor-pointer font-semibold text-blue-300">
                        Gaia DR3 · {source.source_id}
                      </summary>
                      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                        <div><dt className="text-observatory-muted">RA (ICRS)</dt><dd className="font-mono">{source.ra_deg.toFixed(6)}°</dd></div>
                        <div><dt className="text-observatory-muted">Dec (ICRS)</dt><dd className="font-mono">{source.dec_deg.toFixed(6)}°</dd></div>
                        <div><dt className="text-observatory-muted">PMRA</dt><dd>{source.pmra_mas_yr} mas/yr</dd></div>
                        <div><dt className="text-observatory-muted">PMDec</dt><dd>{source.pmdec_mas_yr} mas/yr</dd></div>
                        <div><dt className="text-observatory-muted">Parallax</dt><dd>{source.parallax_mas ?? 'Not supplied'} mas</dd></div>
                        <div><dt className="text-observatory-muted">G magnitude</dt><dd>{source.g_mag ?? 'Not supplied'}</dd></div>
                        <div><dt className="text-observatory-muted">BP − RP</dt><dd>{source.bp_rp ?? 'Not supplied'}</dd></div>
                        <div><dt className="text-observatory-muted">Reference epoch</dt><dd>{source.ref_epoch}</dd></div>
                        <div><dt className="text-observatory-muted">RA at epoch</dt><dd>{source.ra_at_epoch_deg.toFixed(6)}°</dd></div>
                        <div><dt className="text-observatory-muted">Dec at epoch</dt><dd>{source.dec_at_epoch_deg.toFixed(6)}°</dd></div>
                      </dl>
                    </details>
                  ))}
                  {wiseVisible && overlays.data.wise_sources.map((source) => (
                    <details key={source.designation} className="rounded-lg border border-observatory-border p-3 text-xs">
                      <summary className="cursor-pointer font-semibold text-amber-300">
                        AllWISE · {source.designation}
                      </summary>
                      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                        <div><dt className="text-observatory-muted">RA (ICRS)</dt><dd className="font-mono">{source.ra_deg.toFixed(6)}°</dd></div>
                        <div><dt className="text-observatory-muted">Dec (ICRS)</dt><dd className="font-mono">{source.dec_deg.toFixed(6)}°</dd></div>
                        <div><dt className="text-observatory-muted">W1</dt><dd>{source.w1_mag ?? 'Not supplied'}</dd></div>
                        <div><dt className="text-observatory-muted">W2</dt><dd>{source.w2_mag ?? 'Not supplied'}</dd></div>
                      </dl>
                    </details>
                  ))}
                </div>
                <a href={overlays.data.wiseview_url} target="_blank" rel="noreferrer"
                  className="inline-block text-xs text-observatory-cyan underline">
                  Open WiseView context
                </a>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}