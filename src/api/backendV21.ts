type JsonRecord = Record<string, unknown>

function record(value: unknown): JsonRecord | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : undefined
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

export type BackendV21Orientation = {
  north: string
  east: string
  origin: string
}

export type ObservationV21Metadata = {
  pixelScaleArcsec?: number
  orientation?: BackendV21Orientation
  fluxUnit?: string
  surveyWeek?: string
  surveyPass?: string
}

export function readObservationV21Metadata(value: unknown): ObservationV21Metadata {
  const source = record(value)
  if (!source) return {}

  const rawOrientation = record(source.orientation)
  const orientation = rawOrientation &&
    nonEmptyString(rawOrientation.north) &&
    nonEmptyString(rawOrientation.east) &&
    nonEmptyString(rawOrientation.origin)
    ? {
        north: rawOrientation.north as string,
        east: rawOrientation.east as string,
        origin: rawOrientation.origin as string,
      }
    : undefined

  return {
    pixelScaleArcsec: finiteNumber(source.pixel_scale_arcsec),
    orientation,
    fluxUnit: nonEmptyString(source.flux_unit),
    surveyWeek: nonEmptyString(source.survey_week),
    surveyPass: nonEmptyString(source.survey_pass),
  }
}

export type GaiaCrossmatchMetadata = {
  matched: boolean
  discoveryStatus?: string
  sourceId?: string | null
  separationArcsec?: number | null
  gMagnitude?: number | null
  pmraMasYr?: number | null
  pmdecMasYr?: number | null
  parallaxMas?: number | null
}

export type SourceV21Metadata = {
  fluxUjy?: number
  fluxErrorUjy?: number
  positionErrorArcsec?: number
  flagLabels?: string[]
  gaiaCrossmatch?: GaiaCrossmatchMetadata
}

export function readSourceV21Metadata(value: unknown): SourceV21Metadata {
  const source = record(value)
  if (!source) return {}

  const crossmatch = record(source.gaia_crossmatch)
  const labels = Array.isArray(source.flag_labels)
    ? source.flag_labels.filter((label): label is string => typeof label === 'string')
    : undefined

  let gaiaCrossmatch: GaiaCrossmatchMetadata | undefined
  if (typeof crossmatch?.matched === 'boolean') {
    gaiaCrossmatch = {
      matched: crossmatch.matched,
      discoveryStatus: nonEmptyString(crossmatch.discovery_status),
      sourceId: typeof crossmatch.gaia_source_id === 'string' || crossmatch.gaia_source_id === null
        ? crossmatch.gaia_source_id
        : undefined,
      separationArcsec: finiteNumber(crossmatch.separation_arcsec) ?? (
        crossmatch.separation_arcsec === null ? null : undefined
      ),
      gMagnitude: finiteNumber(crossmatch.g_mag) ?? (
        crossmatch.g_mag === null ? null : undefined
      ),
      pmraMasYr: finiteNumber(crossmatch.pmra_mas_yr) ?? (
        crossmatch.pmra_mas_yr === null ? null : undefined
      ),
      pmdecMasYr: finiteNumber(crossmatch.pmdec_mas_yr) ?? (
        crossmatch.pmdec_mas_yr === null ? null : undefined
      ),
      parallaxMas: finiteNumber(crossmatch.parallax_mas) ?? (
        crossmatch.parallax_mas === null ? null : undefined
      ),
    }
  }

  return {
    fluxUjy: finiteNumber(source.flux_ujy),
    fluxErrorUjy: finiteNumber(source.flux_err_ujy),
    positionErrorArcsec: finiteNumber(source.position_err_arcsec),
    flagLabels: labels,
    gaiaCrossmatch,
  }
}

export type OverlayV21Metadata = {
  coverageFraction?: number
  coverageComplete?: boolean
  coverageWarning?: string | null
}

export function readOverlayV21Metadata(value: unknown): OverlayV21Metadata {
  const source = record(value)
  if (!source) return {}

  const fraction = finiteNumber(source.fov_coverage_fraction)
  return {
    coverageFraction:
      fraction !== undefined && fraction >= 0 && fraction <= 1 ? fraction : undefined,
    coverageComplete:
      typeof source.coverage_complete === 'boolean'
        ? source.coverage_complete
        : undefined,
    coverageWarning:
      typeof source.coverage_warning === 'string' || source.coverage_warning === null
        ? source.coverage_warning
        : undefined,
  }
}

export type DifferenceDisplayScale = {
  vmin: number
  vmax: number
  unit: string
  stretch: string
  colormap: string
}

export type DifferenceV21Metadata = {
  earlyWavelengthUm?: number
  lateWavelengthUm?: number
  photometricScaleFactor?: number
  wavelengthCompatible?: boolean
  scientificWarning?: string | null
  displayScale?: DifferenceDisplayScale
}

export function readDifferenceV21Metadata(value: unknown): DifferenceV21Metadata {
  const source = record(value)
  if (!source) return {}

  const scale = record(source.display_scale)
  const vmin = finiteNumber(scale?.vmin)
  const vmax = finiteNumber(scale?.vmax)
  const unit = nonEmptyString(scale?.unit)
  const stretch = nonEmptyString(scale?.stretch)
  const colormap = nonEmptyString(scale?.colormap)
  const displayScale =
    vmin !== undefined &&
    vmax !== undefined &&
    vmin < vmax &&
    unit &&
    stretch &&
    colormap
      ? { vmin, vmax, unit, stretch, colormap }
      : undefined

  return {
    earlyWavelengthUm: finiteNumber(source.early_wavelength_um),
    lateWavelengthUm: finiteNumber(source.late_wavelength_um),
    photometricScaleFactor: finiteNumber(source.photometric_scale_factor),
    wavelengthCompatible:
      typeof source.wavelength_compatible === 'boolean'
        ? source.wavelength_compatible
        : undefined,
    scientificWarning:
      typeof source.scientific_warning === 'string' || source.scientific_warning === null
        ? source.scientific_warning
        : undefined,
    displayScale,
  }
}

export function readQualityFlagDefinitions(value: unknown): Array<{
  bit: number
  label: string
}> {
  const source = record(value)
  const definitions = record(source?.quality_flag_definitions)
  if (!definitions) return []

  return Object.entries(definitions)
    .map(([bit, label]) => ({ bit: Number(bit), label }))
    .filter((entry) => Number.isInteger(entry.bit) && entry.bit >= 0 && typeof entry.label === 'string')
    .sort((left, right) => left.bit - right.bit)
}
