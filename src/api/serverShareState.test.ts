import { describe, expect, it } from 'vitest'
import {
  applyRestoredShareToSearchParams,
  readRestoredInvestigationShareState,
} from './serverShareState'

describe('server investigation share state', () => {
  it('reads the fields documented in the v2.1 share request', () => {
    expect(readRestoredInvestigationShareState({
      state: {
        ra: '08h55m10.831s',
        dec: '-07d14m42.53s',
        fov_arcmin: 15,
        detector: '6',
        earlier_epoch: '2025-S1',
        later_epoch: '2026-S1',
        selected_object_ra: 133.79458,
        selected_object_dec: -7.24542,
        active_view: 'isolation',
        overlays_enabled: ['gaia_dr3', 'wise', 'unknown'],
      },
    })).toEqual({
      ra: '08h55m10.831s',
      dec: '-07d14m42.53s',
      fovArcmin: 15,
      detector: '6',
      earlierEpoch: '2025-S1',
      laterEpoch: '2026-S1',
      selectedObjectRa: 133.79458,
      selectedObjectDec: -7.24542,
      activeView: 'isolation',
      overlaysEnabled: ['gaia_dr3', 'wise'],
    })
  })

  it('ignores unknown or malformed server state', () => {
    expect(readRestoredInvestigationShareState(null)).toBeNull()
    expect(readRestoredInvestigationShareState({ state: {} })).toBeNull()
    expect(readRestoredInvestigationShareState({
      state: { ra: {}, dec: [], fov_arcmin: '15' },
    })).toBeNull()
  })

  it('restores coordinates, FOV and catalogue visibility while preserving other URL state', () => {
    const current = new URLSearchParams('share=a91f4c82e0&frame=frame-1&band=all')
    const next = applyRestoredShareToSearchParams(current, {
      ra: 133.795129,
      dec: -7.245147,
      fovArcmin: 15,
      overlaysEnabled: ['gaia_dr3', 'wise'],
    })

    expect(next.get('share')).toBe('a91f4c82e0')
    expect(next.get('ra')).toBe('133.795129')
    expect(next.get('dec')).toBe('-7.245147')
    expect(next.get('fov')).toBe('15')
    expect(next.get('layers')).toBe('gaia,wise')
    expect(next.get('frame')).toBe('frame-1')
    expect(next.get('band')).toBe('all')
  })
})
