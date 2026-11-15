import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SynchronizedDifferenceViewer from './SynchronizedDifferenceViewer'

const baseProps = {
  earlierUrl: '/api/cache/earlier.png',
  laterUrl: '/api/cache/later.png',
  differenceUrl: '/api/cache/difference.png',
  shapeNyNx: [146, 146],
}

describe('SynchronizedDifferenceViewer significance layer', () => {
  it('shows and switches to the significance map only when the backend returns its URL', () => {
    render(
      <SynchronizedDifferenceViewer
        {...baseProps}
        significanceUrl="/api/cache/significance.png"
      />,
    )

    const toggle = screen.getByRole('button', { name: 'Significance map' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('img', { name: 'Significance map' })).toHaveAttribute(
      'src',
      '/api/cache/significance.png',
    )
  })

  it('does not render a significance control when the response omits the URL', () => {
    render(<SynchronizedDifferenceViewer {...baseProps} />)

    expect(screen.queryByRole('button', { name: 'Significance map' })).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Difference image' })).toHaveAttribute(
      'src',
      '/api/cache/difference.png',
    )
  })
})
