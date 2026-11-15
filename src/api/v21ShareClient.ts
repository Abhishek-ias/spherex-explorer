import createClient from 'openapi-fetch'
import { API_BASE_URL } from '@/api/baseUrl'
import { createTimeoutFetch } from '@/api/timeoutFetch'
import type { BackendV21SharePaths } from './v21ShareTypes'

// These two routes are documented as live in the v2.1 handoff, but are absent
// from the checked-in generated v2.0 OpenAPI contract.
export const apiV21Share = createClient<BackendV21SharePaths>({
  baseUrl: API_BASE_URL,
  fetch: createTimeoutFetch(fetch),
})
