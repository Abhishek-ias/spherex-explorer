import { z } from 'zod'
import { searchParamsSchema } from './searchParams'

const backupSchema = z.object({
  version: z.literal(1),
  savedAt: z.string().min(1).max(64).refine((value) => Number.isFinite(Date.parse(value))),
  pathname: z.literal('/explore'),
  search: z.string().max(4000),
}).strict()

export type InvestigationBackup = z.infer<typeof backupSchema>

const allowedKeys = [
  'ra', 'dec', 'fov', 'frame', 'compare', 'band',
  'layers', 'gaiaOpacity', 'wiseOpacity', 'obj',
] as const

function isOptionalIdentifier(value: string | null): boolean {
  return value === null || (value.trim().length > 0 && value.length <= 256)
}

function isValidBand(value: string | null): boolean {
  if (value === null) return true
  const match = /^(-?\d+(?:\.\d+)?):(-?\d+(?:\.\d+)?)$/.exec(value)
  if (!match) return false
  const lower = Number(match[1])
  const upper = Number(match[2])
  return Number.isFinite(lower) && Number.isFinite(upper) && lower >= 0 && upper > lower
}

function isValidLayers(value: string | null): boolean {
  if (value === null || value === '') return true
  const layers = value.split(',')
  return layers.every((layer) => layer === 'gaia' || layer === 'wise') &&
    new Set(layers).size === layers.length
}

function isValidOpacity(value: string | null): boolean {
  if (value === null) return true
  const number = Number(value)
  return Number.isInteger(number) && number >= 10 && number <= 100
}

function validateSearch(search: string): URLSearchParams | null {
  if (search.length > 4000) return null
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  if (allowedKeys.some((key) => params.getAll(key).length > 1)) return null
  const coordinates = searchParamsSchema.safeParse({
    ra: params.get('ra'),
    dec: params.get('dec'),
    fov: params.get('fov'),
  })

  if (!coordinates.success) return null
  if (!isOptionalIdentifier(params.get('frame'))) return null
  if (!isOptionalIdentifier(params.get('compare'))) return null
  if (!isOptionalIdentifier(params.get('obj'))) return null
  if (!isValidBand(params.get('band'))) return null
  if (!isValidLayers(params.get('layers'))) return null
  if (!isValidOpacity(params.get('gaiaOpacity'))) return null
  if (!isValidOpacity(params.get('wiseOpacity'))) return null

  return params
}

function whitelistSearch(params: URLSearchParams): string {
  const filtered = new URLSearchParams()
  for (const key of allowedKeys) {
    const values = params.getAll(key)
    if (values.length > 0) filtered.set(key, values[values.length - 1])
  }
  return filtered.toString()
}

export function createInvestigationBackup(
  pathname: string,
  search: string,
  savedAt = new Date().toISOString(),
): string | null {
  if (pathname !== '/explore') return null
  const params = validateSearch(search)
  if (!params) return null

  const payload: InvestigationBackup = {
    version: 1,
    savedAt,
    pathname: '/explore',
    search: whitelistSearch(params),
  }

  return JSON.stringify(payload, null, 2)
}

export function restoreInvestigationBackup(value: unknown): string | null {
  const parsed = backupSchema.safeParse(value)
  if (!parsed.success) return null
  const params = validateSearch(parsed.data.search)
  return params ? whitelistSearch(params) : null
}
