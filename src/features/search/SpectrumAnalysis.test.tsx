import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import SpectrumAnalysis from './SpectrumAnalysis'

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  reset: vi.fn(),
  isPending: false,
  isError: false,
  error: null as Error | null,
  data: undefined as unknown,
}))

vi.mock('@/api/hooks/useSpectrumCompare', () => ({
  useSpectrumCompare: () => ({
    mutate: mocks.mutate,
    reset: mocks.reset,
    isPending: mocks.isPending,
    isError: mocks.isError,
    error: mocks.error,
    data: mocks.data,
  }),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

beforeEach(() => {
  mocks.isPending = false
  mocks.isError = false
  mocks.error = null
  mocks.data = undefined
})

describe('SpectrumAnalysis controls', () => {
  it('explains when fewer than two epochs are available', () => {
    render(<SpectrumAnalysis ra={12} dec={-34} epochs={['epoch-1']} />)

    expect(screen.getByText(/at least two survey epochs/i)).toBeInTheDocument()
    expect(screen.getByText(/Available epoch: epoch-1/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Compare spectra' })).not.toBeInTheDocument()
  })

  it('submits the selected epoch pair and configured request values', () => {
    render(
      <SpectrumAnalysis
        ra={153.18875}
        dec={-12.582417}
        epochs={['epoch-early', 'epoch-late', 'epoch-third']}
      />,
    )

    const earlier = screen.getByLabelText('Earlier epoch')
    const later = screen.getByLabelText('Later epoch')

    expect(earlier).toHaveValue('epoch-early')
    expect(later).toHaveValue('epoch-late')

    fireEvent.change(earlier, { target: { value: 'epoch-third' } })
    fireEvent.change(later, { target: { value: 'epoch-early' } })
    fireEvent.click(screen.getByRole('button', { name: 'Compare spectra' }))

    expect(mocks.mutate).toHaveBeenCalledWith({
      ra: 153.18875,
      dec: -12.582417,
      earlier_epoch: 'epoch-third',
      later_epoch: 'epoch-early',
      max_exposures_per_epoch: 36,
    })
  })

  it('prevents selecting the same epoch for both sides', () => {
    render(
      <SpectrumAnalysis
        ra={10}
        dec={20}
        epochs={['epoch-1', 'epoch-2']}
      />,
    )

    fireEvent.change(screen.getByLabelText('Later epoch'), {
      target: { value: 'epoch-1' },
    })

    expect(screen.getByText('Select two different epochs.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Compare spectra' })).toBeDisabled()
    expect(mocks.mutate).not.toHaveBeenCalled()
  })

  it('exposes spectrum request errors through an alert region', () => {
    mocks.isError = true
    mocks.error = new Error('Spectrum comparison failed (503)')

    render(
      <SpectrumAnalysis
        ra={10}
        dec={20}
        epochs={['epoch-1', 'epoch-2']}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Spectrum comparison failed (503)')
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(mocks.reset).toHaveBeenCalledOnce()
  })

  it('disables the compare control while a request is pending', () => {
    mocks.isPending = true

    render(
      <SpectrumAnalysis
        ra={10}
        dec={20}
        epochs={['epoch-1', 'epoch-2']}
      />,
    )

    expect(screen.getByRole('button', { name: 'Comparing…' })).toBeDisabled()
  })
})
