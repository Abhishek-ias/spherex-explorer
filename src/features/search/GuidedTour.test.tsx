import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import GuidedTour from './GuidedTour'

afterEach(cleanup)

describe('GuidedTour accessibility and focus', () => {
  it('announces step changes and provides named navigation controls', () => {
    render(<GuidedTour />)

    const trigger = screen.getByRole('button', { name: 'Take a guided tour' })
    fireEvent.click(trigger)

    expect(screen.getByRole('region', { name: 'SPHEREx Explorer guided tour' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Step 1 of 4')
    expect(screen.getByRole('heading', { name: 'Search a position' })).toHaveAttribute('aria-live', 'polite')

    fireEvent.click(screen.getByRole('button', { name: 'Next tour step' }))
    expect(screen.getByRole('status')).toHaveTextContent('Step 2 of 4')
    expect(screen.getByRole('heading', { name: 'Explore observations' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Previous tour step' }))
    expect(screen.getByRole('status')).toHaveTextContent('Step 1 of 4')
  })

  it('returns focus to the tour trigger when the tour is closed', () => {
    render(<GuidedTour />)

    const trigger = screen.getByRole('button', { name: 'Take a guided tour' })
    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }))

    expect(screen.queryByRole('region', { name: 'SPHEREx Explorer guided tour' })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes from the final step and restores the trigger focus', () => {
    render(<GuidedTour />)

    const trigger = screen.getByRole('button', { name: 'Take a guided tour' })
    fireEvent.click(trigger)

    for (let index = 0; index < 3; index += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Next tour step' }))
    }

    expect(screen.getByRole('status')).toHaveTextContent('Step 4 of 4')
    fireEvent.click(screen.getByRole('button', { name: 'Finish tour' }))

    expect(trigger).toHaveFocus()
    expect(screen.queryByRole('region', { name: 'SPHEREx Explorer guided tour' })).not.toBeInTheDocument()
  })
})
