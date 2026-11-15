import { describe, expect, it } from 'vitest'
import {
  createInvestigationBackup,
  restoreInvestigationBackup,
} from './investigationBackup'

const validSearch = '?ra=153.188750&dec=-12.582417&fov=15&frame=obs-1&compare=obs-2&band=0.7%3A1.1&layers=gaia%2Cwise&gaiaOpacity=65&wiseOpacity=90&obj=source-1'

describe('investigation backup', () => {
  it('exports the supported investigation URL state to a versioned JSON document', () => {
    const encoded = createInvestigationBackup('/explore', validSearch, '2026-11-15T10:00:00.000Z')
    expect(encoded).not.toBeNull()
    const decoded = JSON.parse(encoded ?? '{}') as Record<string, unknown>
    expect(decoded).toMatchObject({
      version: 1,
      pathname: '/explore',
      savedAt: '2026-11-15T10:00:00.000Z',
    })
    expect(typeof decoded.search).toBe('string')
    expect(decoded.search).toContain('frame=obs-1')
    expect(decoded.search).toContain('gaiaOpacity=65')
  })

  it('restores validated parameters and drops unsupported query keys', () => {
    const encoded = createInvestigationBackup('/explore', `${validSearch}&unexpected=ignored`)
    const restored = restoreInvestigationBackup(JSON.parse(encoded ?? '{}'))
    expect(restored).not.toBeNull()
    expect(new URLSearchParams(restored ?? '').get('ra')).toBe('153.188750')
    expect(new URLSearchParams(restored ?? '').get('obj')).toBe('source-1')
    expect(new URLSearchParams(restored ?? '').has('unexpected')).toBe(false)
  })

  it('rejects invalid coordinates, opacity and unknown schema versions', () => {
    expect(createInvestigationBackup('/explore', '?ra=360&dec=0&fov=15')).toBeNull()
    expect(createInvestigationBackup('/explore', '?ra=1&dec=0&fov=15&gaiaOpacity=140')).toBeNull()
    expect(restoreInvestigationBackup({
      version: 2,
      savedAt: '2026-11-15T10:00:00.000Z',
      pathname: '/explore',
      search: validSearch,
    })).toBeNull()
  })

  it('rejects a route that is not an explorer search', () => {
    expect(createInvestigationBackup('/about', validSearch)).toBeNull()
    expect(restoreInvestigationBackup({
      version: 1,
      savedAt: '2026-11-15T10:00:00.000Z',
      pathname: '/about',
      search: validSearch,
    })).toBeNull()
  })
})
