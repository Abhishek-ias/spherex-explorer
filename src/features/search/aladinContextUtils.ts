export function arcminutesToDegrees(arcminutes: number): number {
  if (!Number.isFinite(arcminutes) || arcminutes <= 0) {
    throw new RangeError('Field of view must be a positive finite number.')
  }
  return arcminutes / 60
}
