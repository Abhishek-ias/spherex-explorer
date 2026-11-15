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
import { resolveApiAssetUrl } from '@/api/resolveApiAssetUrl'
import { getWiseImageLayerUrl } from './overlayResourceUtils'
import { useRestoreInvestigationShare } from '@/api/hooks/useServerShare'
import {
  applyRestoredShareToSearchParams,
  readRestoredInvestigationShareState,
} from '@/api/serverShareState'
import type { InvestigationShareRequest } from '@/api/v21ShareTypes'
import {
  readObservationV21Metadata,
  readOverlayV21Metadata,
  readSourceV21Metadata,
} from '@/api/backendV21'

function readOpacityParameter(params: URLSearchParams, key: string): number {
  const value = params.get(key)
  if (value === null) return 80
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 80
  return Math.min(100, Math.max(10, Math.round(parsed)))
}

export default function ExploreWorkspace() {
  const [params, setParams] = useSearchParams()
  const serverSharingEnabled =
    import.meta.env.VITE_USE_MOCKS !== 'true' &&
    Boolean(import.meta.env.VITE_API_BASE_URL?.trim())
  const shareId = params.get('share')
  const serverShare = useRestoreInvestigationShare(shareId, serverSharingEnabled)
  const restoredShareIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!shareId || !serverShare.data || restoredShareIdRef.current === shareId) return
    const restored = readRestoredInvestigationShareState(serverShare.data.state)
    if (!restored) return

    const next = applyRestoredShareToSearchParams(params, restored)
    restoredShareIdRef.current = shareId
    if (next.toString() !== params.toString()) {
      setParams(next, { replace: true })
    }
  }, [shareId, serverShare.data, params, setParams])

  const urlSelectedFrameId = params.get('frame') ?? ''
  const urlCompareFrameId = params.get('compare') ?? ''
  const urlSelectedEpochId = params.get('epoch') ?? ''
  const urlCompareEpochId = params.get('compareEpoch') ?? ''
  const urlDetector = params.get('detector') ?? ''
  const urlTimelineBand = params.get('band') ?? 'all'
  const urlLayers = params.get('layers') ?? ''
  const urlGaiaOpacity = readOpacityParameter(params, 'gaiaOpacity')
  const urlWiseOpacity = readOpacityParameter(params, 'wiseOpacity')
  const uiStateKey = JSON.stringify([
    urlSelectedFrameId,
    urlCompareFrameId,
    urlSelectedEpochId,
    urlCompareEpochId,
    urlDetector,
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
  const toggleGaiaVisible = useExplorerStore((state) => state.toggleGaiaVisible)
  const wiseVisible = useExplorerStore((state) => state.wiseVisible)
  const setWiseVisible = useExplorerStore((state) => state.setWiseVisible)
  const toggleWiseVisible = useExplorerStore((state) => state.toggleWiseVisible)
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
  const wiseImageLayerUrl = getWiseImageLayerUrl(overlays.data)
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

  const detectorFrames = urlDetector
    ? frames.filter((frame) => frame.detector === urlDetector)
    : frames
  const requestedEarlierFrame = urlSelectedEpochId
    ? timelineEntries.find((entry) =>
        entry.epochId === urlSelectedEpochId &&
        (!urlDetector || entry.frame.detector === urlDetector),
      )?.frame
    : undefined
  const selectedFrame = urlSelectedEpochId
    ? requestedEarlierFrame ?? detectorFrames[0] ?? frames[0]
    : detectorFrames.find((frame) => frame.obs_id === selectedId) ?? detectorFrames[0] ?? frames[0]



  const comparableFrames = selectedFrame
    ? frames.filter((frame) => selectedFrame.comparable_with.includes(frame.obs_id))
    : []

  const requestedLaterFrame = urlCompareEpochId
    ? timelineEntries.find((entry) =>
        entry.epochId === urlCompareEpochId &&
        comparableFrames.some((frame) => frame.obs_id === entry.frame.obs_id),
      )?.frame
    : undefined
  const compareFrame = urlCompareEpochId
    ? requestedLaterFrame ?? comparableFrames[0]
    : comparableFrames.find((frame) => frame.obs_id === compareId) ?? comparableFrames[0]
  const selectedEpochId = timelineEntries.find(
    (entry) => entry.frame.obs_id === selectedFrame?.obs_id,
  )?.epochId ?? null
  const compareEpochId = timelineEntries.find(
    (entry) => entry.frame.obs_id === compareFrame?.obs_id,
  )?.epochId ?? null
  const selectedIsLater = Boolean(
    selectedFrame && compareFrame && selectedFrame.mjd > compareFrame.mjd,
  )
  const serverSharePayload: InvestigationShareRequest | undefined =
    selectedFrame && data
      ? {
          ra: data.query_ra_deg,
          dec: data.query_dec_deg,
          fov_arcmin: data.fov_arcmin,
          detector: selectedFrame.detector,
          earlier_epoch: selectedIsLater ? compareEpochId : selectedEpochId,
          later_epoch: selectedIsLater ? selectedEpochId : compareEpochId,
          selected_object_ra: identify.data?.ra_deg ?? null,
          selected_object_dec: identify.data?.dec_deg ?? null,
          active_view: identify.data ? 'isolation' : 'explorer',
          overlays_enabled: [
            ...(gaiaVisible ? ['gaia_dr3'] : []),
            ...(wiseVisible ? ['wise'] : []),
          ],
        }
      : undefined
  const restoredShareState = readRestoredInvestigationShareState(serverShare.data?.state)
  const requestedDetectorAvailable =
    !urlDetector || frames.some((frame) => frame.detector === urlDetector)
  const requestedEarlierEpochAvailable =
    !urlSelectedEpochId || timelineEntries.some((entry) =>
      entry.epochId === urlSelectedEpochId &&
      (!urlDetector || entry.frame.detector === urlDetector),
    )
  const requestedLaterEpochAvailable =
    !urlCompareEpochId || timelineEntries.some((entry) =>
      entry.epochId === urlCompareEpochId &&
      comparableFrames.some((frame) => frame.obs_id === entry.frame.obs_id),
    )
  const serverRestoreMessage = shareId
    ? !serverSharingEnabled
      ? 'This link contains a backend share ID. Connect to the live v2.1 API to retrieve saved state.'
      : serverShare.isPending
        ? 'Retrieving the backend-saved investigation…'
        : serverShare.isError
          ? serverShare.error.message
          : serverShare.data
            ? [
                'Backend share loaded.',
                restoredShareState?.earlierEpoch ? `Earlier epoch: ${restoredShareState.earlierEpoch}.` : '',
                restoredShareState?.laterEpoch ? `Later epoch: ${restoredShareState.laterEpoch}.` : '',
                !requestedDetectorAvailable ? `Detector ${urlDetector} was not returned by this search.` : '',
                !requestedEarlierEpochAvailable ? `Earlier epoch ${urlSelectedEpochId} is not present in the returned observations.` : '',
                !requestedLaterEpochAvailable ? `Later epoch ${urlCompareEpochId} has no backend-approved comparable frame in this search.` : '',
                restoredShareState?.selectedObjectRa !== undefined
                  ? 'The share contains selected-object coordinates; restoring its source marker requires the backend source-lookup route.'
                  : '',
              ].filter(Boolean).join(' ')
            : ''
    : ''

  const selectedFrameMetadata = readObservationV21Metadata(selectedFrame)
  const sourceV21Metadata = readSourceV21Metadata(identify.data)
  const overlayV21Metadata = readOverlayV21Metadata(overlays.data)
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
    urlSelectedEpochId,
    urlCompareEpochId,
    urlDetector,
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
      if (key === 'g') toggleGaiaVisible()
      if (key === 'w') toggleWiseVisible()
    }

    window.addEventListener('keydown', handleLayerShortcut)
    return () => window.removeEventListener('keydown', handleLayerShortcut)
  }, [toggleGaiaVisible, toggleWiseVisible])

  useEffect(() => {
    if (!uiStateHydrated) return

    const next = new URLSearchParams(params)

    if (urlSelectedEpochId) {
      if (requestedEarlierFrame) {
        next.set('frame', requestedEarlierFrame.obs_id)
        next.delete('epoch')
      } else {
        next.delete('frame')
      }
    } else if (selectedFrameId) next.set('frame', selectedFrameId)
    else next.delete('frame')

    if (urlCompareEpochId) {
      if (requestedLaterFrame) {
        next.set('compare', requestedLaterFrame.obs_id)
        next.delete('compareEpoch')
      } else {
        next.delete('compare')
      }
    } else if (compareFrameId) next.set('compare', compareFrameId)
    else next.delete('compare')

    if (urlDetector && requestedDetectorAvailable) next.delete('detector')

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
    requestedEarlierFrame?.obs_id,
    requestedLaterFrame?.obs_id,
    urlSelectedEpochId,
    urlCompareEpochId,
    urlDetector,
    requestedDetectorAvailable,
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
      include_wise_image_layer: true,
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
        <p className="text-sm text-observatory-muted">Searching SPHEREx observations...</p>
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
            {data.total_observations} observations · {data.epochs.length} epochs · FOV {fov} arcmin
          </p>
        </div>
        {import.meta.env.VITE_USE_MOCKS === 'true' && (
          <span className="rounded-full bg-violet-500/15 px-3 py-1.5 text-xs text-violet-300">DEMO DATA</span>
        )}
      </div>

      <div className="flex justify-end"><ShareControls serverSharePayload={serverSharePayload} serverSharingEnabled={serverSharingEnabled} serverRestoreMessage={serverRestoreMessage} /></div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <PanelErrorBoundary panelName="Sky viewer">
            <SkyViewer
              imageUrl={resolveApiAssetUrl(selectedFrame.preview_png_url)}
              wiseImageUrl={wiseVisible && wiseImageLayerUrl ? resolveApiAssetUrl(wiseImageLayerUrl) : undefined}
              wiseImageOpacity={wiseOpacity / 100}
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
            {identify.isPending && <p className="mt-4 text-sm text-observatory-cyan">Identifying source...</p>}
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
                {sourceV21Metadata.flagLabels && sourceV21Metadata.flagLabels.length > 0 && (
                  <p className="text-xs text-observatory-muted">
                    Backend quality labels: {sourceV21Metadata.flagLabels.join(', ')}
                  </p>
                )}
                {sourceV21Metadata.gaiaCrossmatch ? (
                  <div className="rounded-lg border border-observatory-border p-3 text-xs">
                    <p className="font-semibold">Gaia DR3 cross-match</p>
                    <p className="mt-1 text-observatory-muted">
                      {sourceV21Metadata.gaiaCrossmatch.matched
                        ? `Matched${sourceV21Metadata.gaiaCrossmatch.sourceId ? ` · ${sourceV21Metadata.gaiaCrossmatch.sourceId}` : ''}`
                        : `No Gaia counterpart · ${sourceV21Metadata.gaiaCrossmatch.discoveryStatus?.replaceAll('_', ' ') ?? 'verification status not supplied'}`}
                    </p>
                    {sourceV21Metadata.gaiaCrossmatch.separationArcsec !== undefined &&
                      sourceV21Metadata.gaiaCrossmatch.separationArcsec !== null && (
                        <p className="mt-1 text-observatory-muted">
                          Separation: {sourceV21Metadata.gaiaCrossmatch.separationArcsec.toFixed(2)} arcsec
                        </p>
                      )}
                  </div>
                ) : (
                  <p className="text-xs text-observatory-muted">
                    Gaia cross-match metadata was not included in this backend response.
                  </p>
                )}
                <nav aria-label="Selected object actions" className="flex flex-wrap gap-2">
                  <a href="#spectrum-analysis" className="rounded-lg border border-observatory-border px-3 py-2 text-xs hover:border-observatory-cyan">Analyse spectrum</a>
                  <a href="#difference-analysis" className="rounded-lg border border-observatory-border px-3 py-2 text-xs hover:border-observatory-cyan">Compare observations</a>
                  <a href="#tracking-isolation" className="rounded-lg border border-observatory-border px-3 py-2 text-xs hover:border-observatory-cyan">Track & isolate</a>
                  <a href="#catalogue-overlays" className="rounded-lg border border-observatory-border px-3 py-2 text-xs hover:border-observatory-cyan">Catalogue context</a>
                </nav>
                <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Object ID', identify.data.object_id],
                  ['RA', `${identify.data.ra_deg.toFixed(6)}° (${identify.data.ra_hms})`],
                  ['Dec', `${identify.data.dec_deg.toFixed(6)}° (${identify.data.dec_dms})`],
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
                {(sourceV21Metadata.fluxUjy !== undefined ||
                  sourceV21Metadata.fluxErrorUjy !== undefined ||
                  sourceV21Metadata.positionErrorArcsec !== undefined) && (
                  <dl className="grid gap-3 rounded-lg border border-observatory-border p-3 text-xs sm:grid-cols-3">
                    {sourceV21Metadata.fluxUjy !== undefined && (
                      <div><dt className="text-observatory-muted">Point flux</dt><dd className="mt-1 font-mono">{sourceV21Metadata.fluxUjy.toFixed(3)} μJy</dd></div>
                    )}
                    {sourceV21Metadata.fluxErrorUjy !== undefined && (
                      <div><dt className="text-observatory-muted">Point-flux error</dt><dd className="mt-1 font-mono">{sourceV21Metadata.fluxErrorUjy.toFixed(3)} μJy</dd></div>
                    )}
                    {sourceV21Metadata.positionErrorArcsec !== undefined && (
                      <div><dt className="text-observatory-muted">Position uncertainty</dt><dd className="mt-1 font-mono">{sourceV21Metadata.positionErrorArcsec.toFixed(3)} arcsec</dd></div>
                    )}
                  </dl>
                )}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-xl border border-observatory-border bg-observatory-surface p-5">
            <h2 className="font-semibold">Target position</h2>
            <dl className="mt-4 space-y-3 text-sm">
               <div className="flex justify-between gap-3"><dt className="text-observatory-muted">RA</dt><dd className="font-mono">{data.query_ra_deg.toFixed(6)}°</dd></div>
               <div className="flex justify-between gap-3"><dt className="text-observatory-muted">Dec</dt><dd className="font-mono">{data.query_dec_deg.toFixed(6)}°</dd></div>
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
               <div className="flex justify-between gap-3"><dt className="text-observatory-muted">Wavelength</dt><dd>{selectedFrame.em_min_um}–{selectedFrame.em_max_um} μm</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-observatory-muted">Release</dt><dd>{selectedFrame.release}</dd></div>
              {selectedFrameMetadata.pixelScaleArcsec !== undefined && (
                <div className="flex justify-between gap-3"><dt className="text-observatory-muted">Pixel scale</dt><dd>{selectedFrameMetadata.pixelScaleArcsec.toFixed(2)} arcsec/px</dd></div>
              )}
              {selectedFrameMetadata.fluxUnit && (
                <div className="flex justify-between gap-3"><dt className="text-observatory-muted">Flux unit</dt><dd>{selectedFrameMetadata.fluxUnit}</dd></div>
              )}
              {(selectedFrameMetadata.surveyWeek || selectedFrameMetadata.surveyPass) && (
                <div className="flex justify-between gap-3"><dt className="text-observatory-muted">Survey pass</dt><dd>{[selectedFrameMetadata.surveyWeek, selectedFrameMetadata.surveyPass].filter(Boolean).join(' · ')}</dd></div>
              )}
              {selectedFrameMetadata.orientation && (
                <div className="flex justify-between gap-3"><dt className="text-observatory-muted">Orientation</dt><dd className="text-right">{selectedFrameMetadata.orientation.north} / {selectedFrameMetadata.orientation.east}</dd></div>
              )}
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
                 {compareFrame && <p className="mt-3 text-xs text-observatory-muted">{new Date(compareFrame.date_iso).toLocaleDateString()} · {compareFrame.detector}</p>}
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
              {overlays.isPending ? 'Loading catalogues...' : 'Load Gaia & WISE'}
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
                  <span>WISE ({overlays.data.wise_sources.length}){wiseImageLayerUrl ? ' + image' : ''}</span>
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
                    WISE layer opacity · {wiseOpacity}%
                    <input type="range" min="10" max="100" step="5" value={wiseOpacity}
                      disabled={!wiseVisible}
                      onChange={(event) => setWiseOpacity(Number(event.target.value))}
                      aria-label="WISE marker opacity"
                      className="mt-2 w-full accent-amber-400 disabled:opacity-40" />
                  </label>
                </div>
                {(overlayV21Metadata.coverageFraction !== undefined ||
                  overlayV21Metadata.coverageComplete !== undefined ||
                  overlayV21Metadata.coverageWarning !== undefined) && (
                  <div className="rounded-lg border border-observatory-border p-3 text-xs">
                    <p className="font-semibold">Field-of-view coverage</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-observatory-muted">
                      {overlayV21Metadata.coverageFraction !== undefined && (
                        <span>{(overlayV21Metadata.coverageFraction * 100).toFixed(2)}% covered</span>
                      )}
                      {overlayV21Metadata.coverageComplete !== undefined && (
                        <span>{overlayV21Metadata.coverageComplete ? 'Coverage complete' : 'Coverage incomplete'}</span>
                      )}
                    </div>
                    {overlayV21Metadata.coverageWarning && (
                      <p className="mt-2 text-amber-300">{overlayV21Metadata.coverageWarning}</p>
                    )}
                  </div>
                )}
                {wiseImageLayerUrl && (
                  <p className="text-xs text-observatory-muted">
                    The backend supplied a WISE raster layer. The WISE toggle and opacity control apply to both its image and source markers.
                  </p>
                )}
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