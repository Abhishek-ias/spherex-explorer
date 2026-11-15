import { describe, expect, it } from 'vitest'
import { getNextSequenceIndex, normalizeSequenceIndex } from './isolationSequence'

describe('backend isolation sequence controls', () => {
  it('cycles through the frames actually returned by the backend', () => {
    expect(getNextSequenceIndex(0, 2)).toBe(1)
    expect(getNextSequenceIndex(1, 2)).toBe(0)
  })

  it('handles empty and invalid frame collections safely', () => {
    expect(getNextSequenceIndex(0, 0)).toBe(-1)
    expect(getNextSequenceIndex(0, -1)).toBe(-1)
  })

  it('clamps selected index to the available frames', () => {
    expect(normalizeSequenceIndex(-3, 2)).toBe(0)
    expect(normalizeSequenceIndex(6, 2)).toBe(1)
    expect(normalizeSequenceIndex(Number.NaN, 2)).toBe(0)
    expect(normalizeSequenceIndex(0, 0)).toBe(-1)
  })
})
