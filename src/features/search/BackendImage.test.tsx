import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BackendImage from './BackendImage'

describe('BackendImage', () => {
  it('renders the backend image URL with an accessible description', () => {
    render(<BackendImage src="/api/cache/example.png" alt="Difference image" />)

    expect(screen.getByRole('img', { name: 'Difference image' })).toHaveAttribute(
      'src',
      '/api/cache/example.png',
    )
  })

  it('shows an explicit fallback and lets the user retry a failed resource', () => {
    const { container } = render(
      <BackendImage src="/api/cache/example.png" alt="Difference image" />,
    )
    fireEvent.error(screen.getByRole('img', { name: 'Difference image' }))

    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Difference image: image unavailable',
    )
    expect(screen.getByText('Image preview unavailable')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Retry image' }))
    expect(container.querySelector('img')).toBeInTheDocument()
  })

  it('keeps caller styling and draggable behavior', () => {
    render(
      <BackendImage
        src="/api/cache/example.png"
        alt="Difference image"
        className="h-full w-full object-contain"
        draggable
      />,
    )

    expect(screen.getByRole('img')).toHaveClass('object-contain')
    expect(screen.getByRole('img')).toHaveProperty('draggable', true)
  })
})
