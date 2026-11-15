import { describe, expect, it } from 'vitest'
import { resolveApiAssetUrl } from './resolveApiAssetUrl'

describe('resolveApiAssetUrl', () => {
  it('resolves backend-relative preview paths against the API origin', () => {
    expect(
      resolveApiAssetUrl(
        '/api/preview?cutout_url=frame.fits',
        'http://localhost:8000',
      ),
    ).toBe('http://localhost:8000/api/preview?cutout_url=frame.fits')
  })

  it('resolves cached backend image paths against the API origin', () => {
    expect(
      resolveApiAssetUrl('/api/cache/difference.png', 'https://spherex.example.test'),
    ).toBe('https://spherex.example.test/api/cache/difference.png')
  })

  it('preserves absolute IRSA HTTPS URLs', () => {
    expect(
      resolveApiAssetUrl(
        'https://irsa.ipac.caltech.edu/ibe/data/spherex/frame.fits',
        'http://localhost:8000',
      ),
    ).toBe('https://irsa.ipac.caltech.edu/ibe/data/spherex/frame.fits')
  })

  it('rejects unsafe protocols and empty values', () => {
    expect(() =>
      resolveApiAssetUrl('javascript:alert(1)', 'http://localhost:8000'),
    ).toThrow('HTTP or HTTPS')
    expect(() => resolveApiAssetUrl('  ', 'http://localhost:8000')).toThrow('empty')
  })
})
