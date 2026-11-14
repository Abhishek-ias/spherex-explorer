export function nextIsolatedFrameIndex(currentIndex: number, frameCount: number): number {
  if (!Number.isInteger(frameCount) || frameCount <= 0) return 0
  if (!Number.isInteger(currentIndex)) return 0
  return (currentIndex + 1) % frameCount
}

export function clampPlaybackRate(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(4, Math.max(0.5, value))
}
