import { useEffect, useRef, useState } from 'react'
import type { PointerEvent, WheelEvent, MouseEvent, KeyboardEvent } from 'react'
import type { components } from '@/api/schema'
import {
  findOverlayMarkerAtPoint,
  getImageDrawGeometry,
  moveKeyboardImagePoint,
} from './viewerGeometry'

type PixelPoint = components['schemas']['PixelPoint']

export type OverlayMarker = {
  id: string
  x: number
  y: number
  kind: 'gaia' | 'wise'
  opacity?: number
}

type Props = {
  imageUrl: string
  targetPx?: PixelPoint
  title: string
  overlayMarkers?: OverlayMarker[]
  pendingSelection?: { x: number; y: number }
  selectedObject?: PixelPoint
  onOverlaySelect?: (markerId: string, kind: 'gaia' | 'wise') => void
  onIdentify?: (x: number, y: number, width: number, height: number) => void
}

type ViewTransform = {
  zoom: number
  x: number
  y: number
}

export default function SkyViewer({
  imageUrl,
  targetPx,
  title,
  overlayMarkers = [],
  pendingSelection,
  selectedObject,
  onOverlaySelect,
  onIdentify,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const view = useRef<ViewTransform>({ zoom: 1, x: 0, y: 0 })
  const redraw = useRef<() => void>(() => {})
  const drag = useRef({ active: false, moved: false, x: 0, y: 0 })
  const imageSize = useRef({ width: 0, height: 0 })
  const clickTimer = useRef<number | null>(null)
  const keyboardPoint = useRef({ x: 0.5, y: 0.5 })
  const keyboardFocus = useRef(false)
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const [canvasUnavailableUrl, setCanvasUnavailableUrl] = useState<string | null>(null)
  const imageError = Boolean(imageUrl && failedImageUrl === imageUrl)
  const canvasUnavailable = Boolean(imageUrl && canvasUnavailableUrl === imageUrl)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => () => {
    if (clickTimer.current !== null) {
      window.clearTimeout(clickTimer.current)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas) return
    if (!context) {
      setCanvasUnavailableUrl(imageUrl)
      return
    }

    imageSize.current = { width: 0, height: 0 }

    let image: HTMLImageElement | null = null
    let loaded = false
    let dpr = window.devicePixelRatio || 1

    const draw = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (!width || !height) return

      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.fillStyle = '#050a16'
      context.fillRect(0, 0, width, height)

      if (!loaded || !image) {
        context.fillStyle = '#9aa9c2'
        context.font = '14px Inter, sans-serif'
        context.textAlign = 'center'
        context.fillText(
          'Loading preview...',
          width / 2,
          height / 2,
        )
        return
      }

      const fit = Math.min(width / image.width, height / image.height)
      const scale = fit * view.current.zoom
      const drawWidth = image.width * scale
      const drawHeight = image.height * scale
      const x = (width - drawWidth) / 2 + view.current.x
      const y = (height - drawHeight) / 2 + view.current.y

      context.drawImage(image, x, y, drawWidth, drawHeight)

      if (selectedObject) {
        const sx = x + selectedObject.x * scale
        const sy = y + selectedObject.y * scale
        context.beginPath()
        context.arc(sx, sy, 10, 0, Math.PI * 2)
        context.strokeStyle = '#f472b6'
        context.lineWidth = 2
        context.stroke()
        context.beginPath()
        context.moveTo(sx - 14, sy)
        context.lineTo(sx + 14, sy)
        context.moveTo(sx, sy - 14)
        context.lineTo(sx, sy + 14)
        context.stroke()
      }

      if (pendingSelection) {
        const px = x + pendingSelection.x * drawWidth
        const py = y + pendingSelection.y * drawHeight
        context.beginPath()
        context.arc(px, py, 11, 0, Math.PI * 2)
        context.setLineDash([4, 3])
        context.strokeStyle = '#fbbf24'
        context.lineWidth = 2
        context.stroke()
        context.setLineDash([])
      }

      if (keyboardFocus.current) {
        const cursorX = x + keyboardPoint.current.x * drawWidth
        const cursorY = y + keyboardPoint.current.y * drawHeight
        context.beginPath()
        context.arc(cursorX, cursorY, 10, 0, Math.PI * 2)
        context.setLineDash([4, 3])
        context.strokeStyle = '#facc15'
        context.lineWidth = 2
        context.stroke()
        context.setLineDash([])
        context.beginPath()
        context.moveTo(cursorX - 15, cursorY)
        context.lineTo(cursorX + 15, cursorY)
        context.moveTo(cursorX, cursorY - 15)
        context.lineTo(cursorX, cursorY + 15)
        context.stroke()
      }

      if (targetPx) {
        const tx = x + targetPx.x * scale
        const ty = y + targetPx.y * scale
        context.strokeStyle = '#22d3ee'
        context.lineWidth = 1.5
        context.beginPath()
        context.moveTo(tx - 14, ty)
        context.lineTo(tx + 14, ty)
        context.moveTo(tx, ty - 14)
        context.lineTo(tx, ty + 14)
        context.arc(tx, ty, 8, 0, Math.PI * 2)
        context.stroke()
      }

      for (const marker of overlayMarkers) {
        const mx = x + marker.x * scale
        const my = y + marker.y * scale

        context.beginPath()
        context.arc(mx, my, 6, 0, Math.PI * 2)
        const previousAlpha = context.globalAlpha
        context.globalAlpha = marker.opacity ?? 1
        context.fillStyle = marker.kind === 'gaia'
          ? 'rgba(59,130,246,0.22)'
          : 'rgba(245,158,11,0.22)'
        context.strokeStyle = marker.kind === 'gaia' ? '#60a5fa' : '#fbbf24'
        context.lineWidth = 1.7
        context.fill()
        context.stroke()
        context.globalAlpha = previousAlpha
      }
    }

    redraw.current = draw

    const resize = () => {
      dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(canvas.clientWidth * dpr)
      canvas.height = Math.round(canvas.clientHeight * dpr)
      draw()
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()

    if (imageUrl) {
      image = new Image()
      image.onload = () => {
        loaded = true
        imageSize.current = {
          width: image?.naturalWidth ?? 0,
          height: image?.naturalHeight ?? 0,
        }
        draw()
      }
      image.onerror = () => {
        loaded = false
        setFailedImageUrl(imageUrl)
        draw()
      }
      image.src = imageUrl
    } else {
      draw()
    }

    return () => {
      observer.disconnect()
      if (image) {
        image.onload = null
        image.onerror = null
      }
    }
  }, [imageUrl, retryCount, targetPx, overlayMarkers, pendingSelection, selectedObject])

  function zoomBy(factor: number) {
    view.current.zoom = Math.max(0.5, Math.min(8, view.current.zoom * factor))
    redraw.current()
  }

  function handleCanvasKeyDown(event: KeyboardEvent<HTMLCanvasElement>) {
    if (event.key === '+' || event.key === '=') {
      event.preventDefault()
      zoomBy(1.25)
      return
    }
    if (event.key === '-') {
      event.preventDefault()
      zoomBy(1 / 1.25)
      return
    }
    if (event.key === '0') {
      event.preventDefault()
      view.current = { zoom: 1, x: 0, y: 0 }
      redraw.current()
      return
    }

    const nextPoint = moveKeyboardImagePoint(keyboardPoint.current, event.key)
    if (nextPoint) {
      event.preventDefault()
      keyboardPoint.current = nextPoint
      redraw.current()
      return
    }

    if (event.key === 'Enter' && onIdentify && imageSize.current.width > 0) {
      event.preventDefault()
      const canvas = event.currentTarget
      const geometry = getImageDrawGeometry(
        canvas.clientWidth,
        canvas.clientHeight,
        imageSize.current.width,
        imageSize.current.height,
        view.current.zoom,
        view.current.x,
        view.current.y,
      )
      if (!geometry) return
      onIdentify(
        keyboardPoint.current.x * geometry.width,
        keyboardPoint.current.y * geometry.height,
        geometry.width,
        geometry.height,
      )
    }
  }

  function handleCanvasFocus() {
    keyboardFocus.current = true
    redraw.current()
  }

  function handleCanvasBlur() {
    keyboardFocus.current = false
    redraw.current()
  }

  function retryPreview() {
    setRetryCount((count) => count + 1)
  }

  function handleWheel(event: WheelEvent<HTMLCanvasElement>) {
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const mx = event.clientX - rect.left - rect.width / 2
    const my = event.clientY - rect.top - rect.height / 2
    const oldZoom = view.current.zoom
    const nextZoom = Math.max(
      0.5,
      Math.min(8, oldZoom * (event.deltaY < 0 ? 1.15 : 1 / 1.15)),
    )
    const ratio = nextZoom / oldZoom
    view.current.x = mx - (mx - view.current.x) * ratio
    view.current.y = my - (my - view.current.y) * ratio
    view.current.zoom = nextZoom
    redraw.current()
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    drag.current = {
      active: true,
      moved: false,
      x: event.clientX,
      y: event.clientY,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!drag.current.active) return
    const dx = event.clientX - drag.current.x
    const dy = event.clientY - drag.current.y
    if (Math.abs(dx) + Math.abs(dy) > 2) drag.current.moved = true
    view.current.x += dx
    view.current.y += dy
    drag.current.x = event.clientX
    drag.current.y = event.clientY
    redraw.current()
  }

  function handleClick(event: MouseEvent<HTMLCanvasElement>) {
    if (drag.current.moved || !imageUrl || imageError) return

    const rect = event.currentTarget.getBoundingClientRect()
    const { width: imageWidth, height: imageHeight } = imageSize.current
    const geometry = getImageDrawGeometry(
      rect.width,
      rect.height,
      imageWidth,
      imageHeight,
      view.current.zoom,
      view.current.x,
      view.current.y,
    )
    if (!geometry) return

    // Capture primitive values now; React's currentTarget is not safe to read
    // from a delayed callback after this event handler returns.
    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
    const clickX = point.x - geometry.x
    const clickY = point.y - geometry.y
    if (
      clickX < 0 || clickY < 0 ||
      clickX > geometry.width || clickY > geometry.height
    ) return

    const marker = findOverlayMarkerAtPoint(overlayMarkers, point, geometry)

    if (clickTimer.current !== null) {
      window.clearTimeout(clickTimer.current)
    }
    clickTimer.current = window.setTimeout(() => {
      clickTimer.current = null
      if (marker) {
        onOverlaySelect?.(marker.id, marker.kind)
        return
      }
      onIdentify?.(clickX, clickY, geometry.width, geometry.height)
    }, 240)
  }

  function handleDoubleClick(event: MouseEvent<HTMLCanvasElement>) {
    event.preventDefault()
    if (clickTimer.current !== null) {
      window.clearTimeout(clickTimer.current)
      clickTimer.current = null
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const mx = event.clientX - rect.left - rect.width / 2
    const my = event.clientY - rect.top - rect.height / 2
    const oldZoom = view.current.zoom
    const nextZoom = Math.max(0.5, Math.min(8, oldZoom * 1.6))
    const ratio = nextZoom / oldZoom
    view.current.x = mx - (mx - view.current.x) * ratio
    view.current.y = my - (my - view.current.y) * ratio
    view.current.zoom = nextZoom
    redraw.current()
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-observatory-border bg-[#050a16]">
      <div className="flex items-center justify-between border-b border-observatory-border px-4 py-3">
        <span className="text-sm font-semibold">{title}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => zoomBy(1.25)} aria-label="Zoom in"
            className="rounded border border-observatory-border px-3 py-1">+</button>
          <button onClick={() => zoomBy(1 / 1.25)} aria-label="Zoom out"
            className="rounded border border-observatory-border px-3 py-1">−</button>
          <button onClick={() => {
            view.current = { zoom: 1, x: 0, y: 0 }
            redraw.current()
          }} className="rounded border border-observatory-border px-3 py-1 text-xs">Reset</button>
        </div>
      </div>

      {imageUrl && !imageError && !canvasUnavailable ? (
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Observation preview: ${title}. Use arrow keys to move the identification cursor and Enter to identify the marked position.`}
          aria-describedby="sky-viewer-keyboard-help"
          tabIndex={0}
          aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Enter + - 0"
          onFocus={handleCanvasFocus}
          onBlur={handleCanvasBlur}
          onKeyDown={handleCanvasKeyDown}>
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={() => { drag.current.active = false }}
          onPointerCancel={() => { drag.current.active = false }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          className="h-[420px] w-full touch-none cursor-crosshair"
        />
      ) : (
        <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 p-8 text-center"
          role={imageError ? 'alert' : 'status'}
          aria-live="polite">
          {canvasUnavailable && imageUrl && !imageError ? (
            <>
              <p className="text-sm text-observatory-muted">Interactive canvas is unavailable. Showing the static preview instead.</p>
              <img src={imageUrl} alt={`Static observation preview: ${title}`} className="max-h-[420px] max-w-full object-contain" />
            </>
          ) : (
            <p className="text-sm text-observatory-muted">
              {imageError ? 'Preview image unavailable.' : 'No preview image returned.'}
            </p>
          )}
          {imageError && (
            <button type="button" onClick={retryPreview}
              className="rounded-lg border border-observatory-border px-4 py-2 text-sm font-medium hover:border-observatory-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-observatory-cyan">
              Retry preview
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-4 border-t border-observatory-border px-4 py-2 text-xs text-observatory-muted">
        <span><span className="mr-1 text-cyan-400">⊕</span> Target</span>
        <span><span className="mr-1 text-amber-300">◉</span> Pending selection</span>
        <span><span className="mr-1 text-pink-400">⊕</span> Identified source</span>
        <span><span className="mr-1 text-blue-400">○</span> Gaia DR3</span>
        <span><span className="mr-1 text-amber-400">○</span> WISE</span>
        <span>Drag · Scroll to zoom · Double-click to zoom · Click to identify</span>
        <p id="sky-viewer-keyboard-help" className="basis-full text-[11px] leading-5">
          Keyboard: focus the preview, use arrow keys to move the identification cursor,
          press Enter to identify, + / − to zoom, and 0 to reset.
        </p>
      </div>
    </div>
  )
}