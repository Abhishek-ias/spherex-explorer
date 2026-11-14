import { useEffect, useRef, useState } from 'react'
import type { PointerEvent, WheelEvent, MouseEvent } from 'react'
import type { components } from '@/api/schema'

type PixelPoint = components['schemas']['PixelPoint']

export type OverlayMarker = {
  id: string
  x: number
  y: number
  kind: 'gaia' | 'wise'
}

type Props = {
  imageUrl: string
  targetPx?: PixelPoint
  title: string
  overlayMarkers?: OverlayMarker[]
  pendingSelection?: { x: number; y: number }
  selectedObject?: PixelPoint
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
  onIdentify,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const view = useRef<ViewTransform>({ zoom: 1, x: 0, y: 0 })
  const redraw = useRef<() => void>(() => {})
  const drag = useRef({ active: false, moved: false, x: 0, y: 0 })
  const imageSize = useRef({ width: 0, height: 0 })
  const clickTimer = useRef<number | null>(null)
  const [imageError, setImageError] = useState(false)

  useEffect(() => () => {
    if (clickTimer.current !== null) {
      window.clearTimeout(clickTimer.current)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

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
          imageError ? 'Preview image unavailable' : 'Loading preview...',
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
        context.fillStyle = marker.kind === 'gaia'
          ? 'rgba(59,130,246,0.22)'
          : 'rgba(245,158,11,0.22)'
        context.strokeStyle = marker.kind === 'gaia' ? '#60a5fa' : '#fbbf24'
        context.lineWidth = 1.7
        context.fill()
        context.stroke()
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
        setImageError(false)
        draw()
      }
      image.onerror = () => {
        loaded = false
        setImageError(true)
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
  }, [imageUrl, targetPx, imageError, overlayMarkers, pendingSelection, selectedObject])

  function zoomBy(factor: number) {
    view.current.zoom = Math.max(0.5, Math.min(8, view.current.zoom * factor))
    redraw.current()
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

  function identifyAtPointer(event: MouseEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget
    const rect = canvas.getBoundingClientRect()
    const { width: imageWidth, height: imageHeight } = imageSize.current
    if (!imageWidth || !imageHeight) return

    const fit = Math.min(rect.width / imageWidth, rect.height / imageHeight)
    const scale = fit * view.current.zoom
    const drawWidth = imageWidth * scale
    const drawHeight = imageHeight * scale
    const drawLeft = (rect.width - drawWidth) / 2 + view.current.x
    const drawTop = (rect.height - drawHeight) / 2 + view.current.y
    const clickX = event.clientX - rect.left - drawLeft
    const clickY = event.clientY - rect.top - drawTop

    if (
      clickX < 0 || clickY < 0 ||
      clickX > drawWidth || clickY > drawHeight
    ) return

    onIdentify?.(clickX, clickY, drawWidth, drawHeight)
  }

  function handleClick(event: MouseEvent<HTMLCanvasElement>) {
    if (drag.current.moved || !imageUrl || imageError || !onIdentify) return
    if (clickTimer.current !== null) {
      window.clearTimeout(clickTimer.current)
    }
    clickTimer.current = window.setTimeout(() => {
      clickTimer.current = null
      identifyAtPointer(event)
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

      {imageUrl && !imageError ? (
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Observation preview: ${title}. Drag to pan, scroll to zoom, click to identify.`}
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
        <div className="flex h-[420px] items-center justify-center p-8 text-center">
          <p className="text-sm text-observatory-muted">
            {imageError ? 'Preview image unavailable' : 'No preview image returned'}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-4 border-t border-observatory-border px-4 py-2 text-xs text-observatory-muted">
        <span><span className="mr-1 text-cyan-400">⊕</span> Target</span>
        <span><span className="mr-1 text-amber-300">◉</span> Pending selection</span>
        <span><span className="mr-1 text-pink-400">⊕</span> Identified source</span>
        <span><span className="mr-1 text-blue-400">○</span> Gaia DR3</span>
        <span><span className="mr-1 text-amber-400">○</span> WISE</span>
        <span>Drag · Scroll to zoom · Double-click to zoom · Click to identify</span>
      </div>
    </div>
  )
}