export function clampDifferenceZoom(value: number): number {
  return Math.min(4, Math.max(1, value))
}

export function getDifferenceImageAspectRatio(shapeNyNx: number[]): number {
  const [height, width] = shapeNyNx
  if (
    typeof height !== 'number' ||
    typeof width !== 'number' ||
    !Number.isFinite(height) ||
    !Number.isFinite(width) ||
    height <= 0 ||
    width <= 0
  ) return 1

  return width / height
}

export type BlinkEpoch = 'earlier' | 'later'

export function nextBlinkEpoch(current: BlinkEpoch): BlinkEpoch {
  return current === 'earlier' ? 'later' : 'earlier'
}


/**
 * Read the optional v2.1 significance-map resource without changing the
 * generated v2.0 DifferenceResponse type. Only a backend-returned URL is used.
 */
export function getSignificanceImageUrl(value: unknown): string | undefined {
  if (!value || typeof value !== 'object' || !('significance_png_url' in value)) {
    return undefined
  }

  const url = (value as { significance_png_url?: unknown }).significance_png_url
  return typeof url === 'string' && url.trim() ? url : undefined
}
