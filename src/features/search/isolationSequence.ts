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

export type IsolationImageMode =
  | 'isolated'
  | 'follow-object'
  | 'follow-object-with-background'

export type IsolationImageOption = {
  mode: IsolationImageMode
  label: string
  url: string
}

/**
 * Read optional image variants that the backend's v2.1 sample response adds
 * beyond the currently checked-in v2.0 generated IsolatedEpochFrame type.
 * Only backend-returned, non-empty strings are surfaced; no path is inferred.
 */
export function getIsolationImageOptions(frame: unknown): IsolationImageOption[] {
  if (!frame || typeof frame !== 'object') return []

  const record = frame as Record<string, unknown>
  const options: IsolationImageOption[] = []

  if (typeof record.isolated_png_url === 'string' && record.isolated_png_url.trim()) {
    options.push({
      mode: 'isolated',
      label: 'Isolated source',
      url: record.isolated_png_url,
    })
  }

  if (
    typeof record.follow_object_png_url === 'string' &&
    record.follow_object_png_url.trim()
  ) {
    options.push({
      mode: 'follow-object',
      label: 'Follow object',
      url: record.follow_object_png_url,
    })
  }

  if (
    typeof record.follow_object_with_bg_png_url === 'string' &&
    record.follow_object_with_bg_png_url.trim()
  ) {
    options.push({
      mode: 'follow-object-with-background',
      label: 'Follow object + background',
      url: record.follow_object_with_bg_png_url,
    })
  }

  return options
}
