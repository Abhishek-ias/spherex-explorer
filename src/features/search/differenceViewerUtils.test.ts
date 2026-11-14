import { describe, expect, it } from 'vitest'
import {
  clampDifferenceZoom,
  getDifferenceImageAspectRatio,
} from './differenceViewerUtils'

describe('difference viewer helpers', () => {
  it('clamps shared zoom to the supported range', () => {
    expect(clampDifferenceZoom(0.4)).toBe(1)
    expect(clampDifferenceZoom(2.5)).toBe(2.5)
    expect(clampDifferenceZoom(6)).toBe(4)
  })

  it('derives display aspect ratio from backend image shape [height, width]', () => {
    expect(getDifferenceImageAspectRatio([200, 300])).toBe(1.5)
    expect(getDifferenceImageAspectRatio([0, 100])).toBe(1)
  })
})
