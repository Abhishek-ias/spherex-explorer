import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/api/baseUrl'
import { server } from '@/mocks/server'
import ApiHealthIndicator from './ApiHealthIndicator'

function renderIndicator() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ApiHealthIndicator />
    </QueryClientProvider>,
  )
}

describe('ApiHealthIndicator', () => {
  it('shows the mock API status and backend contract version', async () => {
    renderIndicator()

    expect(await screen.findByText('Mock API')).toBeInTheDocument()
    expect(screen.getByText('v2.0.0')).toBeInTheDocument()
  })

  it('shows an accessible unavailable state when the health endpoint fails', async () => {
    server.use(
      http.get(`${API_BASE_URL}/api/health`, () =>
        HttpResponse.json({ detail: 'Service unavailable' }, { status: 503 }),
      ),
    )

    renderIndicator()

    expect(await screen.findByText('API unavailable', {}, { timeout: 5_000 })).toBeInTheDocument()
  })
})
