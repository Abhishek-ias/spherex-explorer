import type { components } from '@/api/schema'

type ObservationFrame = components['schemas']['ObservationFrame']

export type ObservationTimelineEntry = {
  epochId: string
  frame: ObservationFrame
}

export type WavelengthBandOption = {
  value: string
  label: string
  minUm: number
  maxUm: number
}

export function getWavelengthBandValue(
  frame: Pick<ObservationFrame, 'em_min_um' | 'em_max_um'>,
): string {
  return `${frame.em_min_um}:${frame.em_max_um}`
}

export function getWavelengthBandOptions(
  entries: ObservationTimelineEntry[],
): WavelengthBandOption[] {
  const bands = new Map<string, WavelengthBandOption>()

  for (const entry of entries) {
    const { em_min_um: minUm, em_max_um: maxUm } = entry.frame
    const value = getWavelengthBandValue(entry.frame)
    if (!bands.has(value)) {
      bands.set(value, {
        value,
        minUm,
        maxUm,
        label: `${minUm.toFixed(3)}–${maxUm.toFixed(3)} μm`,
      })
    }
  }

  return [...bands.values()].sort(
    (left, right) => left.minUm - right.minUm || left.maxUm - right.maxUm,
  )
}

export function filterTimelineByBand(
  entries: ObservationTimelineEntry[],
  bandValue: string,
): ObservationTimelineEntry[] {
  if (bandValue === 'all') return entries
  return entries.filter(
    ({ frame }) => getWavelengthBandValue(frame) === bandValue,
  )
}
