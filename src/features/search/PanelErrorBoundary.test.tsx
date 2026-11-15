import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import PanelErrorBoundary from './PanelErrorBoundary'

function BrokenPanel() {
  throw new Error('render failed')
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('PanelErrorBoundary', () => {
  it('contains a panel error and keeps a local recovery action available', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <PanelErrorBoundary panelName="Spectrum">
        <BrokenPanel />
      </PanelErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Spectrum is temporarily unavailable')
    expect(screen.getByRole('button', { name: 'Retry panel' })).toBeInTheDocument()
    expect(screen.getByText(/other explorer panels remain available/i)).toBeInTheDocument()
  })

  it('renders children when no error occurs', () => {
    render(
      <PanelErrorBoundary panelName="Timeline">
        <p>Timeline ready</p>
      </PanelErrorBoundary>,
    )

    expect(screen.getByText('Timeline ready')).toBeInTheDocument()
  })
})
