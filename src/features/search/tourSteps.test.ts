import { describe, expect, it } from 'vitest'
import { guidedTourSteps } from './tourSteps'

describe('guided tour content', () => {
  it('covers search, observation exploration, investigation, and sharing', () => {
    expect(guidedTourSteps.map((step) => step.title)).toEqual([
      'Search a position',
      'Explore observations',
      'Investigate the signal',
      'Share your view',
    ])
  })
})
