export type ImageGeometry = {
  x: number
  y: number
  width: number
  height: number
  scale: number
}

export type OverlayHitMarker = {
  id: string
  x: number
  y: number
  kind: 'gaia' | 'wise'
}

export type CanvasPoint = { x: number; y: number }

export function getImageDrawGeometry(
  canvasWidth: number,
  canvasHeight: number,
  imageWidth: number,
  imageHeight: number,
  zoom: number,
  offsetX: number,
  offsetY: number,
): ImageGeometry | null {
  if (
    canvasWidth <= 0 ||
    canvasHeight <= 0 ||
    imageWidth <= 0 ||
    imageHeight <= 0 ||
    !Number.isFinite(zoom)
  ) return null

  const fit = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight)
  const scale = fit * zoom
  const width = imageWidth * scale
  const height = imageHeight * scale

  return {
    x: (canvasWidth - width) / 2 + offsetX,
    y: (canvasHeight - height) / 2 + offsetY,
    width,
    height,
    scale,
  }
}

export function findOverlayMarkerAtPoint(
  markers: OverlayHitMarker[],
  point: CanvasPoint,
  geometry: ImageGeometry,
  hitRadius = 14,
): OverlayHitMarker | null {
  let selected: OverlayHitMarker | null = null
  let closestDistance = hitRadius

  for (const marker of markers) {
    const x = geometry.x + marker.x * geometry.scale
    const y = geometry.y + marker.y * geometry.scale
    const distance = Math.hypot(point.x - x, point.y - y)

    if (distance <= closestDistance) {
      selected = marker
      closestDistance = distance
    }
  }

  return selected
}
