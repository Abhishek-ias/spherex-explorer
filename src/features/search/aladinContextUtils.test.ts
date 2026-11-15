import { describe, expect, it } from 'vitest'
import { arcminutesToDegrees } from './aladinContextUtils'

describe('Aladin context map field of view', () => {
  it('converts arcminutes to decimal degrees', () => {
    expect(arcminutesToDegrees(15)).toBe(0.25)
    expect(arcminutesToDegrees(60)).toBe(1)
  })

  it('rejects invalid field-of-view values', () => {
    expect(() => arcminutesToDegrees(0)).toThrow(RangeError)
    expect(() => arcminutesToDegrees(Number.NaN)).toThrow(RangeError)
  })
})
