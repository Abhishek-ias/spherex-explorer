import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AladinContextMap from './AladinContextMap'

describe('AladinContextMap', () => {
  afterEach(() => {
    cleanup()
    delete window.A
  })

  it('does not initialize the external map until the user requests it', async () => {
    const survey = {}
    const map = {
      gotoRaDec: vi.fn(),
      setFov: vi.fn(),
      newImageSurvey: vi.fn(() => survey),
      setBaseImageLayer: vi.fn(),
    }
    const aladin = vi.fn(() => map)
    Object.defineProperty(window, 'A', {
      configurable: true,
      value: { init: Promise.resolve(), aladin },
    })

    const { rerender } = render(
      <AladinContextMap ra={153.2} dec={-12.5} fovArcmin={15} />,
    )

    expect(aladin).not.toHaveBeenCalled()
    expect(screen.queryByLabelText('Aladin Lite sky context map')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Load context map' }))

    await waitFor(() => expect(aladin).toHaveBeenCalledTimes(1))
    expect(aladin).toHaveBeenCalledWith(
      '#spherex-aladin-context-map',
      expect.objectContaining({
        target: '153.2 -12.5',
        cooFrame: 'ICRSd',
        fov: 0.25,
        showCooGrid: true,
      }),
    )
    expect(map.newImageSurvey).toHaveBeenCalledWith('https://skies.esac.esa.int/DSSColor')
    expect(map.setBaseImageLayer).toHaveBeenCalledWith(survey)
    expect(map.gotoRaDec).toHaveBeenCalledWith(153.2, -12.5)
    expect(map.setFov).toHaveBeenCalledWith(0.25)

    rerender(<AladinContextMap ra={180} dec={10} fovArcmin={30} />)
    await waitFor(() => expect(map.gotoRaDec).toHaveBeenLastCalledWith(180, 10))
    expect(map.setFov).toHaveBeenLastCalledWith(0.5)
  })
})
