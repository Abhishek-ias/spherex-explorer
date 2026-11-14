import { describe, expect, it } from 'vitest'
import { chooseWebmMimeType, fitImageToCanvas } from './webmExportUtils'

describe('WebM export helpers', () => {
  it('prefers VP9, then VP8, then generic WebM when supported', () => {
    expect(chooseWebmMimeType((mime) => mime.includes('vp8') || mime === 'video/webm'))
      .toBe('video/webm;codecs=vp8')
    expect(chooseWebmMimeType((mime) => mime === 'video/webm')).toBe('video/webm')
    expect(chooseWebmMimeType(() => false)).toBeNull()
  })

  it('fits each preview without distorting its aspect ratio', () => {
    expect(fitImageToCanvas(200, 100, 100, 100)).toEqual({
      x: 0, y: 25, width: 100, height: 50,
    })
    expect(fitImageToCanvas(0, 100, 100, 100)).toBeNull()
  })
})
