import { describe, expect, it } from 'vitest'
import { getIsolationImageOptions, getNextSequenceIndex, normalizeSequenceIndex } from './isolationSequence'

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


describe('backend-provided isolation image modes', () => {
  it('shows only the isolated source mode when optional follow images are absent', () => {
    expect(getIsolationImageOptions({
      isolated_png_url: '/api/cache/isolated.png',
    })).toEqual([
      {
        mode: 'isolated',
        label: 'Isolated source',
        url: '/api/cache/isolated.png',
      },
    ])
  })

  it('exposes follow-object views only when the backend returns their URLs', () => {
    expect(getIsolationImageOptions({
      isolated_png_url: '/api/cache/isolated.png',
      follow_object_png_url: '/api/cache/follow.png',
      follow_object_with_bg_png_url: '/api/cache/follow-bg.png',
    })).toEqual([
      {
        mode: 'isolated',
        label: 'Isolated source',
        url: '/api/cache/isolated.png',
      },
      {
        mode: 'follow-object',
        label: 'Follow object',
        url: '/api/cache/follow.png',
      },
      {
        mode: 'follow-object-with-background',
        label: 'Follow object + background',
        url: '/api/cache/follow-bg.png',
      },
    ])
  })

  it('ignores empty, non-string and malformed response containers', () => {
    expect(getIsolationImageOptions({
      isolated_png_url: '',
      follow_object_png_url: 17,
      follow_object_with_bg_png_url: null,
    })).toEqual([])
    expect(getIsolationImageOptions(null)).toEqual([])
    expect(getIsolationImageOptions('not-a-frame')).toEqual([])
  })
})
