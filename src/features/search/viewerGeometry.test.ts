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
