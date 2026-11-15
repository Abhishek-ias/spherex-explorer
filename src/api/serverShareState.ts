type ShareStateRecord = Record<string, unknown>

function isRecord(value: unknown): value is ShareStateRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function coordinate(value: unknown): string | number | undefined {
  if (typeof value === 'string' && value.trim()) return value
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return undefined
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

export type RestoredInvestigationShareState = {
  ra?: string | number
  dec?: string | number
  fovArcmin?: number
  detector?: string | null
  earlierEpoch?: string | null
  laterEpoch?: string | null
  selectedObjectRa?: number | null
  selectedObjectDec?: number | null
  activeView?: string
  overlaysEnabled?: string[]
}

/** Read only fields explicitly documented in the backend v2.1 share handoff. */
export function readRestoredInvestigationShareState(
  value: unknown,
): RestoredInvestigationShareState | null {
  if (!isRecord(value)) return null
  const state = isRecord(value.state) ? value.state : value
  const restored: RestoredInvestigationShareState = {
    ra: coordinate(state.ra),
    dec: coordinate(state.dec),
    fovArcmin: optionalNumber(state.fov_arcmin),
    detector:
      typeof state.detector === 'string' || state.detector === null
        ? state.detector
        : undefined,
    earlierEpoch:
      typeof state.earlier_epoch === 'string' || state.earlier_epoch === null
        ? state.earlier_epoch
        : undefined,
    laterEpoch:
      typeof state.later_epoch === 'string' || state.later_epoch === null
        ? state.later_epoch
        : undefined,
    selectedObjectRa:
      optionalNumber(state.selected_object_ra) ??
      (state.selected_object_ra === null ? null : undefined),
    selectedObjectDec:
      optionalNumber(state.selected_object_dec) ??
      (state.selected_object_dec === null ? null : undefined),
    activeView: optionalString(state.active_view),
    overlaysEnabled: Array.isArray(state.overlays_enabled)
      ? state.overlays_enabled.filter(
          (item): item is string => item === 'gaia_dr3' || item === 'wise',
        )
      : undefined,
  }

  return Object.values(restored).some((item) => item !== undefined)
    ? restored
    : null
}

export function applyRestoredShareToSearchParams(
  current: URLSearchParams,
  state: RestoredInvestigationShareState,
): URLSearchParams {
  const next = new URLSearchParams(current)

  if (state.ra !== undefined) next.set('ra', String(state.ra))
  if (state.dec !== undefined) next.set('dec', String(state.dec))
  if (state.fovArcmin !== undefined) next.set('fov', String(state.fovArcmin))

  if (state.overlaysEnabled !== undefined) {
    const layers = [
      ...(state.overlaysEnabled.includes('gaia_dr3') ? ['gaia'] : []),
      ...(state.overlaysEnabled.includes('wise') ? ['wise'] : []),
    ]
    if (layers.length > 0) next.set('layers', layers.join(','))
    else next.delete('layers')
  }

  // The handoff lists epoch names but does not specify their mapping to
  // individual observation IDs, and the source-lookup route is still awaiting
  // a published contract. Preserve other query state rather than guessing.
  return next
}
