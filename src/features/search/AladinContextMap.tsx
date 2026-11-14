import { useEffect, useState } from 'react'
import { arcminutesToDegrees } from './aladinContextUtils'

type AladinView = {
  gotoRaDec: (raDegrees: number, decDegrees: number) => void
  setFov: (fovDegrees: number) => void
  newImageSurvey?: (baseUrl: string) => unknown
  setBaseImageLayer?: (survey: unknown) => void
}

type AladinGlobal = {
  init: Promise<void>
  aladin: (
    selector: string,
    options: {
      target: string
      cooFrame: 'ICRSd'
      survey: string
      fov: number
      showCooGrid: boolean
      showReticle: boolean
      showFrame: boolean
      showZoomControl: boolean
      showLayersControl: boolean
      showContextMenu: boolean
    },
  ) => AladinView
}

declare global {
  interface Window {
    A?: AladinGlobal
  }
}

type Props = {
  ra: number
  dec: number
  fovArcmin: number
}

type MapStatus = 'idle' | 'loading' | 'ready' | 'error'

let aladinScriptPromise: Promise<void> | null = null

function loadAladinScript(): Promise<void> {
  if (window.A) return Promise.resolve()
  if (aladinScriptPromise) return aladinScriptPromise

  const scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('aladin-lite-v3-script') as HTMLScriptElement | null
    const script = existing ?? document.createElement('script')

    const onLoad = () => {
      if (window.A) resolve()
      else reject(new Error('Aladin Lite loaded without exposing its API.'))
    }
    const onError = () => reject(new Error('Aladin Lite script could not be downloaded.'))

    script.addEventListener('load', onLoad, { once: true })
    script.addEventListener('error', onError, { once: true })

    if (!existing) {
      script.id = 'aladin-lite-v3-script'
      script.src = 'https://aladin.u-strasbg.fr/AladinLite/api/v3/latest/aladin.js'
      script.async = true
      document.head.appendChild(script)
    }
  }).catch((error: unknown) => {
    aladinScriptPromise = null
    document.getElementById('aladin-lite-v3-script')?.remove()
    throw error
  })

  aladinScriptPromise = scriptPromise
  return scriptPromise
}

export default function AladinContextMap({ ra, dec, fovArcmin }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [status, setStatus] = useState<MapStatus>('idle')
  const [error, setError] = useState('')
  const [mapInstance, setMapInstance] = useState<AladinView | null>(null)

  useEffect(() => {
    if (!expanded) return

    let cancelled = false

    async function initialize() {
      setStatus('loading')
      setError('')

      try {
        await loadAladinScript()
        const aladinApi = window.A
        if (!aladinApi) throw new Error('Aladin Lite API is unavailable.')

        await aladinApi.init
        if (cancelled) return

        const map = aladinApi.aladin('#spherex-aladin-context-map', {
          target: `${ra} ${dec}`,
          cooFrame: 'ICRSd',
          survey: 'P/DSS2/color',
          fov: arcminutesToDegrees(fovArcmin),
          showCooGrid: true,
          showReticle: true,
          showFrame: true,
          showZoomControl: true,
          showLayersControl: true,
          showContextMenu: true,
        })

        // Prefer the ESA-hosted DSS Color HiPS mirror while CDS services are degraded.
        try {
          const mirroredSurvey = map.newImageSurvey?.('https://skies.esac.esa.int/DSSColor')
          if (mirroredSurvey) map.setBaseImageLayer?.(mirroredSurvey)
        } catch {
          // Keep Aladin's default survey if a mirror is unavailable.
        }

        if (!cancelled) {
          setMapInstance(map)
          setStatus('ready')
        }
      } catch (reason) {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : 'The context map could not be initialized.')
          setStatus('error')
        }
      }
    }

    void initialize()

    return () => {
      cancelled = true
      setMapInstance(null)
    }
  }, [expanded])

  useEffect(() => {
    if (!mapInstance || status !== 'ready') return
    mapInstance.gotoRaDec(ra, dec)
    mapInstance.setFov(arcminutesToDegrees(fovArcmin))
  }, [mapInstance, status, ra, dec, fovArcmin])

  return (
    <section className="rounded-xl border border-observatory-border bg-observatory-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Aladin Lite context map</h2>
          <p className="mt-1 text-xs text-observatory-muted">
            External reference survey · ICRS · {fovArcmin} arcmin
          </p>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="spherex-aladin-context-panel"
          onClick={() => setExpanded((value) => !value)}
          className="rounded-lg border border-observatory-border px-3 py-2 text-xs hover:border-observatory-cyan"
        >
          {expanded ? 'Hide context map' : 'Load context map'}
        </button>
      </div>

      {expanded && (
        <div id="spherex-aladin-context-panel" className="mt-4 space-y-3">
          <p className="text-xs leading-5 text-observatory-muted">
            This is an optical/infrared survey context layer from an external HiPS provider,
            not a SPHEREx observation or a backend scientific measurement. The centre and
            field of view follow the current SPHEREx search position.
          </p>

          {status === 'loading' && (
            <div role="status" className="flex h-72 items-center justify-center rounded-lg border border-observatory-border bg-[#050a16] text-sm text-observatory-muted">
              Loading Aladin Lite…
            </div>
          )}

          {status === 'error' && (
            <div role="alert" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
              <p className="font-semibold text-amber-300">Context map unavailable</p>
              <p className="mt-2 text-observatory-muted">{error}</p>
              <a
                href="https://aladin.cds.unistra.fr/AladinLite/"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-observatory-cyan underline"
              >
                Open the Aladin Lite fallback viewer
              </a>
            </div>
          )}

          <div
            id="spherex-aladin-context-map"
            aria-label="Aladin Lite sky context map"
            className={`w-full overflow-hidden rounded-lg border border-observatory-border bg-[#050a16] ${status === 'ready' ? 'block' : 'hidden'}`}
            style={{ height: 320 }}
          />

          <p className="text-[11px] leading-5 text-observatory-muted">
            Aladin Lite retains its attribution and provider controls. External survey tile
            availability depends on the mirror service.
          </p>
        </div>
      )}
    </section>
  )
}
