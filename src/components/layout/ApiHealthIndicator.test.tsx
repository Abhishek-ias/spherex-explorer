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
    expect(screen.getByText('v2.1.0')).toBeInTheDocument()
  })

  it('renders the v2.1 quality-flag dictionary returned by the backend', async () => {
    server.use(
      http.get(`${API_BASE_URL}/api/health`, () =>
        HttpResponse.json({
          status: 'ok',
          service: 'SPHEREx Explorer Backend',
          version: '2.1.0',
          quality_flag_definitions: {
            '0': 'TRANSIENT (Cosmic ray or transient spike)',
            '1': 'OVERFLOW (Detector saturation / ADC overflow)',
            '21': 'SOURCE (Detected astronomical point/extended source)',
          },
        }),
      ),
    )

    renderIndicator()

    expect(await screen.findByText('API connected')).toBeInTheDocument()
    expect(screen.getByText('v2.1.0')).toBeInTheDocument()
    expect(screen.getByText('SPHEREx quality-flag dictionary · 3 definitions')).toBeInTheDocument()
    expect(screen.getByText('SOURCE (Detected astronomical point/extended source)')).toBeInTheDocument()
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
