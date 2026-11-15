export function getNextSequenceIndex(
  currentIndex: number,
  frameCount: number,
): number {
  if (!Number.isInteger(frameCount) || frameCount <= 0) return -1
  const normalizedCurrent = Number.isInteger(currentIndex)
    ? Math.max(0, Math.min(frameCount - 1, currentIndex))
    : 0
  return (normalizedCurrent + 1) % frameCount
}

export function normalizeSequenceIndex(
  index: number,
  frameCount: number,
): number {
  if (!Number.isInteger(frameCount) || frameCount <= 0) return -1
  if (!Number.isFinite(index)) return 0
  return Math.max(0, Math.min(frameCount - 1, Math.floor(index)))
}
