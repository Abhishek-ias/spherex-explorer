import type { components } from '@/api/schema'

type EpochSpectrumBundle = components['schemas']['EpochSpectrumBundle']
type RawSpectralPoint = components['schemas']['RawSpectralPoint']

export type ChannelCoverage = {
  available: number
  returned: number
  total: 102
  wavelengthMinUm: number | null
  wavelengthMaxUm: number | null
}

export function getChannelCoverage(bundle: EpochSpectrumBundle): ChannelCoverage {
  const available = bundle.channels_102.filter(
    (channel) => channel.measured && channel.flux !== null,
  )
  const wavelengths = available.map((channel) => channel.wavelength_um)

  return {
    available: available.length,
    returned: bundle.channels_102.length,
    total: 102,
    wavelengthMinUm: wavelengths.length ? Math.min(...wavelengths) : null,
    wavelengthMaxUm: wavelengths.length ? Math.max(...wavelengths) : null,
  }
}

export function getFlaggedRawPoints(
  points: RawSpectralPoint[],
): RawSpectralPoint[] {
  // The contract defines a numeric quality_flag but no code-to-meaning legend.
  // Surface non-zero values verbatim; do not assign unsupported meanings.
  return points.filter((point) => point.quality_flag !== 0)
}
