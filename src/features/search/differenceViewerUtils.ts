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
