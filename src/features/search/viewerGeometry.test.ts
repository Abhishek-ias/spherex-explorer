import { describe, expect, it } from 'vitest'
import {
  findOverlayMarkerAtPoint,
  getImageDrawGeometry,
} from './viewerGeometry'

describe('viewer geometry and overlay hit testing', () => {
  it('fits the image without changing its aspect ratio and applies the view transform', () => {
    expect(getImageDrawGeometry(400, 300, 200, 100, 2, 10, -5)).toEqual({
      x: -190,
      y: -55,
      width: 800,
      height: 400,
      scale: 4,
    })
  })

  it('selects the nearest catalogue marker inside the hit radius', () => {
    const geometry = getImageDrawGeometry(400, 300, 200, 100, 1, 0, 0)
    if (!geometry) throw new Error('Expected image geometry')
    const marker = { id: 'gaia-1', x: 100, y: 50, kind: 'gaia' as const }

    expect(findOverlayMarkerAtPoint([marker], { x: 200, y: 150 }, geometry))
      .toEqual(marker)
    expect(findOverlayMarkerAtPoint([marker], { x: 230, y: 150 }, geometry))
      .toBeNull()
  })

  it('returns no geometry for non-positive image or canvas dimensions', () => {
    expect(getImageDrawGeometry(400, 300, 0, 100, 1, 0, 0)).toBeNull()
  })
})


describe('keyboard selection navigation', () => {
  it('moves the image cursor in each direction', async () => {
    const { moveKeyboardImagePoint } = await import('./viewerGeometry')
    expect(moveKeyboardImagePoint({ x: 0.5, y: 0.5 }, 'ArrowLeft')).toEqual({ x: 0.48, y: 0.5 })
    expect(moveKeyboardImagePoint({ x: 0.5, y: 0.5 }, 'ArrowRight')).toEqual({ x: 0.52, y: 0.5 })
    expect(moveKeyboardImagePoint({ x: 0.5, y: 0.5 }, 'ArrowUp')).toEqual({ x: 0.5, y: 0.48 })
    expect(moveKeyboardImagePoint({ x: 0.5, y: 0.5 }, 'ArrowDown')).toEqual({ x: 0.5, y: 0.52 })
  })

  it('clamps to the image and ignores unrelated keys', async () => {
    const { moveKeyboardImagePoint } = await import('./viewerGeometry')
    expect(moveKeyboardImagePoint({ x: 0, y: 1 }, 'ArrowLeft')).toEqual({ x: 0, y: 1 })
    expect(moveKeyboardImagePoint({ x: 1, y: 0 }, 'ArrowUp')).toEqual({ x: 1, y: 0 })
    expect(moveKeyboardImagePoint({ x: 0.5, y: 0.5 }, 'Enter')).toBeNull()
  })
})
