import { describe, expect, it } from 'vitest'
import {
  clampDifferenceZoom,
  getDifferenceImageAspectRatio,
  getSignificanceImageUrl,
  nextBlinkEpoch,
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

describe('difference blink comparison', () => {
  it('alternates between earlier and later epochs', () => {
    expect(nextBlinkEpoch('earlier')).toBe('later')
    expect(nextBlinkEpoch('later')).toBe('earlier')
  })
})


describe('optional significance map resource', () => {
  it('returns the backend-provided significance image URL', () => {
    expect(getSignificanceImageUrl({
      significance_png_url: '/api/cache/significance.png',
    })).toBe('/api/cache/significance.png')
  })

  it('does not invent a significance map when the response omits it', () => {
    expect(getSignificanceImageUrl({
      difference_png_url: '/api/cache/difference.png',
    })).toBeUndefined()
    expect(getSignificanceImageUrl(null)).toBeUndefined()
    expect(getSignificanceImageUrl({ significance_png_url: '' })).toBeUndefined()
    expect(getSignificanceImageUrl({ significance_png_url: 5 })).toBeUndefined()
  })
})
