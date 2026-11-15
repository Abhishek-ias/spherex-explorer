import { describe, expect, it } from 'vitest'
import { searchParamsSchema } from './searchParams'

describe('searchParamsSchema', () => {
  it('accepts valid decimal coordinates and a supported FOV', () => {
    expect(searchParamsSchema.safeParse({
      ra: '153.188750',
      dec: '-12.582417',
      fov: '15',
    }).success).toBe(true)
  })

  it('rejects RA at 360 degrees because the upper bound is exclusive', () => {
    expect(searchParamsSchema.safeParse({
      ra: '360',
      dec: '0',
      fov: '15',
    }).success).toBe(false)
  })

  it('accepts the inclusive declination limits', () => {
    expect(searchParamsSchema.safeParse({
      ra: '0',
      dec: '-90',
      fov: '5',
    }).success).toBe(true)
    expect(searchParamsSchema.safeParse({
      ra: '0',
      dec: '90',
      fov: '5',
    }).success).toBe(true)
  })

  it('rejects unsupported field-of-view values', () => {
    expect(searchParamsSchema.safeParse({
      ra: '10',
      dec: '20',
      fov: '10',
    }).success).toBe(false)
  })

  it('rejects non-numeric and out-of-range values', () => {
    expect(searchParamsSchema.safeParse({
      ra: 'not-a-number',
      dec: '91',
      fov: '15',
    }).success).toBe(false)
  })
})
