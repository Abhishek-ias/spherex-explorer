import { describe, expect, it } from 'vitest'
import type { components } from '@/api/schema'
import { filterPresetTargets } from './targetSearch'

type PresetTarget = components['schemas']['PresetTarget']

const targets: PresetTarget[] = [
  {
    id: 'target-1',
    name: 'Target Alpha',
    category: 'GALAXY',
    ra: '10:00:00',
    dec: '+10:00:00',
    ra_deg: 150,
    dec_deg: 10,
    description: 'Nearby spiral galaxy',
  },
  {
    id: 'target-2',
    name: 'Target Beta',
    category: 'STAR',
    ra: '12:00:00',
    dec: '-10:00:00',
    ra_deg: 180,
    dec_deg: -10,
    description: 'Bright reference star',
  },
]

describe('filterPresetTargets', () => {
  it('filters by target name, category, or description', () => {
    expect(filterPresetTargets(targets, 'beta').map((target) => target.id))
      .toEqual(['target-2'])
    expect(filterPresetTargets(targets, 'galaxy').map((target) => target.id))
      .toEqual(['target-1'])
    expect(filterPresetTargets(targets, 'reference star').map((target) => target.id))
      .toEqual(['target-2'])
  })

  it('returns all targets for an empty query and no records for a miss', () => {
    expect(filterPresetTargets(targets, ' ')).toHaveLength(2)
    expect(filterPresetTargets(targets, 'no match')).toEqual([])
  })
})
