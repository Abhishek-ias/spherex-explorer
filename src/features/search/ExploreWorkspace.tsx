import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { useSearchObservations } from '@/api/hooks/useSearchObservations'
import { useIdentifyObject } from '@/api/hooks/useIdentifyObject'
import { useCatalogOverlays } from '@/api/hooks/useCatalogOverlays'
import SkyViewer, { type OverlayMarker } from './SkyViewer'
import SpectrumAnalysis from './SpectrumAnalysis'
import DifferenceAnalysis from './DifferenceAnalysis'
import TrackingIsolation from './TrackingIsolation'
import ShareControls from './ShareControls'

const paramsSchema = z.object({
  ra: z.string().min(1).transform(Number).pipe(z.number().finite().min(0).max(360)),
  dec: z.string().min(1).transform(Number).pipe(z.number().finite().min(-90).max(90)),
  fov: z.string().min(1).transform(Number).pipe(
    z.number().refine((value) => [5, 15, 30, 60].includes(value)),
  ),
})

export default function ExploreWorkspace() {
  const [params, setParams] = useSearchParams()
  const parsed = paramsSchema.safeParse({
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

  const [identifyError, setIdentifyError] = useState('')
  const [gaiaVisible, setGaiaVisible] = useState(() => params.get('layers')?.split(',').includes('gaia') ?? false)
  const [wiseVisible, setWiseVisible] = useState(() => params.get('layers')?.split(',').includes('wise') ?? false)

  const frames = useMemo(
    () => data?.epochs.flatMap((epoch) => epoch.observations)
      .slice().sort((a, b) => a.mjd - b.mjd) ?? [],
    [data],
  )

  const [selectedId, setSelectedId] = useState(() => params.get('frame') ?? '')
  const [compareId, setCompareId] = useState(() => params.get('compare') ?? '')
  const selectedFrame = frames.find((frame) => frame.obs_id === selectedId) ?? frames[0]



  const comparableFrames = selectedFrame
    ? frames.filter((frame) => selectedFrame.comparable_with.includes(frame.obs_id))
    : []

  const compareFrame = comparableFrames.find((frame) => frame.obs_id === compareId) ?? comparableFrames[0]
  const selectedFrameId = selectedFrame?.obs_id
  const compareFrameId = compareFrame?.obs_id

  useEffect(() => {
    const next = new URLSearchParams(params)

    if (selectedFrameId) next.set('frame', selectedFrameId)
    else next.delete('frame')

    if (compareFrameId) next.set('compare', compareFrameId)
    else next.delete('compare')

    const layers = [
      ...(gaiaVisible ? ['gaia'] : []),
      ...(wiseVisible ? ['wise'] : []),
    ]

    if (layers.length) next.set('layers', layers.join(','))
    else next.delete('layers')

    if (identify.data?.object_id) next.set('obj', identify.data.object_id)

    if (next.toString() !== params.toString()) {
      setParams(next, { replace: true })
    }
  }, [
    selectedFrameId,
    compareFrameId,
    gaiaVisible,
    wiseVisible,
    identify.data?.object_id,
    params,
    setParams,
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
          }] : []
        })
      : []

    return [...gaia, ...wise]
  }, [selectedFrameId, overlays.data, gaiaVisible, wiseVisible])

  function identifyAt(x: number, y: number, width: number, height: number) {
    if (ra === undefined || dec === undefined || fov === undefined || !selectedFrame) return
    if (!selectedFrame.cutout_fits_url) {
      setIdentifyError('This observation does not provide a cutout FITS URL.')
      return
    }

    setIdentifyError('')
    identify.mutate({
      cutout_fits_url: selectedFrame.cutout_fits_url,
      click_x: x,
      click_y: y,
      rendered_width: width,
      rendered_height: height,
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

  if (!parsed.success) return <Navigate to="/" replace />

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
          <SkyViewer
            imageUrl={selectedFrame.preview_png_url}
            targetPx={selectedFrame.target_px}
            title={selectedFrame.obs_id}
            onIdentify={identifyAt}
            overlayMarkers={overlayMarkers}
          />

          <section className="rounded-xl border border-observatory-border bg-observatory-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold">Observation timeline</h2>
              <span className="text-xs text-observatory-muted">{frames.length} frames</span>
            </div>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {frames.map((frame, index) => (
                <button key={frame.obs_id} onClick={() => {
                    identify.reset()
                    setIdentifyError('')
                    setSelectedId(frame.obs_id)
                  }}
                  className={`min-w-36 rounded-lg border p-3 text-left transition ${
                    frame.obs_id === selectedFrame.obs_id
                      ? 'border-violet-400 bg-violet-500/15'
                      : 'border-observatory-border hover:border-observatory-cyan'
                  }`}>
                  <p className="text-xs text-observatory-muted">Frame {index + 1}</p>
                  <p className="mt-1 text-sm font-semibold">{new Date(frame.date_iso).toLocaleDateString()}</p>
                  <p className="mt-1 font-mono text-[10px] text-observatory-muted">{frame.detector}</p>
                </button>
              ))}
            </div>
          </section>

          <SpectrumAnalysis
            ra={parsed.data.ra}
            dec={parsed.data.dec}
            epochs={data.epochs.map((epoch) => epoch.epoch_id)}
          />
          <DifferenceAnalysis
            key={`${selectedFrame.obs_id}-${compareFrame?.obs_id ?? 'none'}`}
            ra={parsed.data.ra}
            dec={parsed.data.dec}
            firstFrame={selectedFrame}
            secondFrame={compareFrame}
          />
          <TrackingIsolation
            firstFrame={selectedFrame}
            secondFrame={compareFrame}
            source={identify.data}
          />

          <section className="rounded-xl border border-observatory-border bg-observatory-surface p-5">
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
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
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

          <section className="rounded-xl border border-observatory-border bg-observatory-surface p-5">
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
                    onChange={(event) => setGaiaVisible(event.target.checked)} />
                </label>
                <label className="flex items-center justify-between text-sm">
                  <span>WISE ({overlays.data.wise_sources.length})</span>
                  <input type="checkbox" checked={wiseVisible}
                    onChange={(event) => setWiseVisible(event.target.checked)} />
                </label>
                <div className="text-xs text-observatory-muted">
                  CSA NEOSSat observations: {overlays.data.csa_neossat_observations.length}
                </div>
                <div className="max-h-52 space-y-2 overflow-y-auto">
                  {gaiaVisible && overlays.data.gaia_dr3_sources.map((source) => (
                    <div key={source.source_id} className="rounded-lg border border-observatory-border p-3 text-xs">
                      <p className="font-semibold text-blue-300">Gaia {source.source_id}</p>
                      <p className="mt-1 text-observatory-muted">
                        RA {source.ra_deg.toFixed(5)} ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Dec {source.dec_deg.toFixed(5)}
                      </p>
                      <p className="mt-1 text-observatory-muted">
                        PMRA {source.pmra_mas_yr} ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· PMDEC {source.pmdec_mas_yr} mas/yr
                      </p>
                      <p className="mt-1 text-observatory-muted">
                        Parallax {source.parallax_mas ?? 'Not supplied'} mas
                      </p>
                    </div>
                  ))}
                  {wiseVisible && overlays.data.wise_sources.map((source) => (
                    <div key={source.designation} className="rounded-lg border border-observatory-border p-3 text-xs">
                      <p className="font-semibold text-amber-300">{source.designation}</p>
                      <p className="mt-1 text-observatory-muted">
                        W1 {source.w1_mag ?? 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â'} ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· W2 {source.w2_mag ?? 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â'}
                      </p>
                    </div>
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