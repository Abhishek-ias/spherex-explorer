import { describe, expect, it } from 'vitest'
import {
  clampPlaybackRate,
  nextIsolatedFrameIndex,
} from './isolationPlayerUtils'

describe('isolation player helpers', () => {
  it('steps through frames and wraps at the end', () => {
    expect(nextIsolatedFrameIndex(0, 2)).toBe(1)
    expect(nextIsolatedFrameIndex(1, 2)).toBe(0)
    expect(nextIsolatedFrameIndex(4, 0)).toBe(0)
  })

  it('clamps playback speed to the supported range', () => {
    expect(clampPlaybackRate(0.1)).toBe(0.5)
    expect(clampPlaybackRate(2)).toBe(2)
    expect(clampPlaybackRate(8)).toBe(4)
    expect(clampPlaybackRate(Number.NaN)).toBe(1)
  })
})
