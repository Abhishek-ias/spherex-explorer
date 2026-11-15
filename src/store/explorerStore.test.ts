import { beforeEach, describe, expect, it } from 'vitest'
import { useExplorerStore, type ExplorerUrlState } from './explorerStore'

const initialState: ExplorerUrlState = {
  selectedFrameId: '',
  compareFrameId: '',
  timelineBand: 'all',
  gaiaVisible: false,
  wiseVisible: false,
  gaiaOpacity: 80,
  wiseOpacity: 80,
}

beforeEach(() => {
  useExplorerStore.setState({ ...initialState, hydrationKey: null, selectedOverlay: null })
})

describe('explorer Zustand UI store', () => {
  it('hydrates frame, comparison, timeline and layer state from URL values', () => {
    const nextState: ExplorerUrlState = {
      selectedFrameId: 'obs-early',
      compareFrameId: 'obs-late',
      timelineBand: '0.7:1.1',
      gaiaVisible: true,
      wiseVisible: false,
      gaiaOpacity: 65,
      wiseOpacity: 90,
    }
    useExplorerStore.getState().hydrateFromUrl('share-state-key', nextState)
    const current = useExplorerStore.getState()

    expect(current.hydrationKey).toBe('share-state-key')
    expect(current.selectedFrameId).toBe('obs-early')
    expect(current.compareFrameId).toBe('obs-late')
    expect(current.timelineBand).toBe('0.7:1.1')
    expect(current.gaiaVisible).toBe(true)
    expect(current.wiseVisible).toBe(false)
    expect(current.gaiaOpacity).toBe(65)
    expect(current.wiseOpacity).toBe(90)
  })

  it('clears catalogue selection when the selected frame changes', () => {
    const current = useExplorerStore.getState()
    current.setSelectedOverlay({ id: 'source-1', kind: 'gaia' })
    current.setSelectedFrameId('obs-next')

    expect(useExplorerStore.getState().selectedFrameId).toBe('obs-next')
    expect(useExplorerStore.getState().selectedOverlay).toBeNull()
  })

  it('toggles catalogue visibility from keyboard-action store methods', () => {
    const state = useExplorerStore.getState()
    state.toggleGaiaVisible()
    state.toggleWiseVisible()
    expect(useExplorerStore.getState().gaiaVisible).toBe(true)
    expect(useExplorerStore.getState().wiseVisible).toBe(true)
    useExplorerStore.getState().toggleGaiaVisible()
    expect(useExplorerStore.getState().gaiaVisible).toBe(false)
  })

  it('updates Gaia and WISE visibility and opacity independently', () => {
    const current = useExplorerStore.getState()
    current.setGaiaVisible(true)
    current.setWiseVisible(true)
    current.setGaiaOpacity(40)
    current.setWiseOpacity(75)

    const updated = useExplorerStore.getState()
    expect(updated.gaiaVisible).toBe(true)
    expect(updated.wiseVisible).toBe(true)
    expect(updated.gaiaOpacity).toBe(40)
    expect(updated.wiseOpacity).toBe(75)
  })
})
