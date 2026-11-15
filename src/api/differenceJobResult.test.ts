import { describe, expect, it } from 'vitest'
import { parseDifferenceJobResult } from './differenceJobResult'

const response = {
  diff_key: 'demo-diff',
  difference_png_url: 'https://example.test/difference.png',
  significance_png_url: 'https://example.test/significance.png',
  early_date: '2025-01-01T00:00:00Z',
  late_date: '2025-01-02T00:00:00Z',
  shape_ny_nx: [128, 128],
  target_px: { x: 64, y: 64 },
  comparable_with: ['obs-2'],
  candidates: [],
}

describe('parseDifferenceJobResult', () => {
  it('accepts a result that matches the generated DifferenceResponse shape', () => {
    expect(parseDifferenceJobResult(response)).toEqual(response)
  })

  it('preserves the optional backend significance map resource', () => {
    expect(parseDifferenceJobResult(response)?.significance_png_url).toBe(
      'https://example.test/significance.png',
    )
  })

  it('accepts legacy v2.0 results without a significance map', () => {
    const { significance_png_url: _ignored, ...legacy } = response
    expect(parseDifferenceJobResult(legacy)).not.toBeNull()
  })

  it('rejects a completed job whose result does not match DifferenceResponse', () => {
    expect(parseDifferenceJobResult({ status: 'completed' })).toBeNull()
    expect(parseDifferenceJobResult(null)).toBeNull()
  })
})
