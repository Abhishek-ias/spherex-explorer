import type { components } from '@/api/schema'

type PresetTarget = components['schemas']['PresetTarget']

export function filterPresetTargets(
  targets: PresetTarget[],
  query: string,
): PresetTarget[] {
  const normalized = query.trim().toLocaleLowerCase()
  if (!normalized) return targets

  return targets.filter((target) =>
    `${target.name} ${target.category} ${target.description}`
      .toLocaleLowerCase()
      .includes(normalized),
  )
}
