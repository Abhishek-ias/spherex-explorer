const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const configuredAssetBaseUrl = import.meta.env.VITE_ASSET_BASE_URL?.trim()
const useMocks = import.meta.env.VITE_USE_MOCKS === 'true'
const browserOrigin =
  typeof window === 'undefined' ? 'http://localhost:8000' : window.location.origin

// Browser MSW can only intercept requests on the frontend origin.
// Mocked JSON therefore stays same-origin; backend image resources can use
// a separate live backend/tunnel origin via VITE_ASSET_BASE_URL.
export const API_BASE_URL = useMocks
  ? browserOrigin
  : configuredApiBaseUrl || browserOrigin

export const API_ASSET_BASE_URL =
  configuredAssetBaseUrl ||
  (!useMocks && configuredApiBaseUrl) ||
  browserOrigin
