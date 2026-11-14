import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

afterEach(() => cleanup())
import WebMExport from './WebMExport'

describe('WebMExport', () => {
  it('keeps the export disabled until at least two observation frames exist', () => {
    render(<WebMExport frames={[]} />)

    expect(screen.getByRole('button', { name: 'Export WebM' })).toBeDisabled()
    expect(screen.getByText('At least two backend-returned observation frames are required.'))
      .toBeInTheDocument()
  })

  it('enables export when two backend-returned observation frames are available', () => {
    render(
      <WebMExport
        frames={[
          { obsId: 'obs-1', dateIso: '2025-01-01T00:00:00Z', imageUrl: 'https://example.test/one.png' },
          { obsId: 'obs-2', dateIso: '2025-01-02T00:00:00Z', imageUrl: 'https://example.test/two.png' },
        ]}
      />,
    )

    expect(screen.getByRole('button', { name: 'Export WebM' })).toBeEnabled()
    expect(screen.getByText('2 available observation frames')).toBeInTheDocument()
  })
})
