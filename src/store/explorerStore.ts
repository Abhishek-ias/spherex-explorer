import { create } from 'zustand'

export type OverlaySelection = { id: string; kind: 'gaia' | 'wise' }

export type ExplorerUrlState = {
  selectedFrameId: string
  compareFrameId: string
  timelineBand: string
  gaiaVisible: boolean
  wiseVisible: boolean
  gaiaOpacity: number
  wiseOpacity: number
}

type ExplorerStore = ExplorerUrlState & {
  hydrationKey: string | null
  selectedOverlay: OverlaySelection | null
  hydrateFromUrl: (key: string, state: ExplorerUrlState) => void
  setSelectedFrameId: (id: string) => void
  setCompareFrameId: (id: string) => void
  setTimelineBand: (band: string) => void
  setGaiaVisible: (visible: boolean) => void
  setWiseVisible: (visible: boolean) => void
  setGaiaOpacity: (opacity: number) => void
  setWiseOpacity: (opacity: number) => void
  setSelectedOverlay: (overlay: OverlaySelection | null) => void
}

const initialState: ExplorerUrlState = {
  selectedFrameId: '',
  compareFrameId: '',
  timelineBand: 'all',
  gaiaVisible: false,
  wiseVisible: false,
  gaiaOpacity: 80,
  wiseOpacity: 80,
}

export const useExplorerStore = create<ExplorerStore>((set) => ({
  ...initialState,
  hydrationKey: null,
  selectedOverlay: null,
  hydrateFromUrl: (key, state) => set({ ...state, hydrationKey: key, selectedOverlay: null }),
  setSelectedFrameId: (selectedFrameId) => set({ selectedFrameId, selectedOverlay: null }),
  setCompareFrameId: (compareFrameId) => set({ compareFrameId }),
  setTimelineBand: (timelineBand) => set({ timelineBand }),
  setGaiaVisible: (gaiaVisible) => set({ gaiaVisible }),
  setWiseVisible: (wiseVisible) => set({ wiseVisible }),
  setGaiaOpacity: (gaiaOpacity) => set({ gaiaOpacity }),
  setWiseOpacity: (wiseOpacity) => set({ wiseOpacity }),
  setSelectedOverlay: (selectedOverlay) => set({ selectedOverlay }),
}))
