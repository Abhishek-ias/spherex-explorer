import createClient from 'openapi-fetch'
import type { paths } from '@/api/schema'
import { API_BASE_URL } from '@/api/baseUrl'
import { createTimeoutFetch } from '@/api/timeoutFetch'

export const api = createClient<paths>({
  baseUrl: API_BASE_URL,
  fetch: createTimeoutFetch(fetch),
})
