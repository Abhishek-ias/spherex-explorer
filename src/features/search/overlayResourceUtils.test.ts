import { describe, expect, it } from 'vitest'
import { getWiseImageLayerUrl } from './overlayResourceUtils'

describe('getWiseImageLayerUrl', () => {
  it('returns the backend-provided WISE image URL', () => {
    expect(getWiseImageLayerUrl({
      wise_image_png_url: '/api/cache/wise_layer_a1b2c3d4e5f67890.png',
    })).toBe('/api/cache/wise_layer_a1b2c3d4e5f67890.png')
  })

  it('does not synthesize a URL when the response omits or malforms it', () => {
    expect(getWiseImageLayerUrl({ wise_sources: [] })).toBeUndefined()
    expect(getWiseImageLayerUrl({ wise_image_png_url: '' })).toBeUndefined()
    expect(getWiseImageLayerUrl({ wise_image_png_url: 12 })).toBeUndefined()
    expect(getWiseImageLayerUrl(null)).toBeUndefined()
  })
})
