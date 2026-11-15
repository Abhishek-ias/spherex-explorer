import { z } from 'zod'
import type { components } from '@/api/schema'

type DifferenceResponse = components['schemas']['DifferenceResponse']
const pixelPointSchema = z.object({
  x: z.number(),
  y: z.number(),
})

const candidateMatchSchema = z.object({
  matched: z.boolean(),
  match_type: z.enum([
    'moving_dipole_pair',
    'variable_stationary',
    'unmatched_residual',
  ]),
  counterpart_ra_deg: z.number().nullable().optional(),
  counterpart_dec_deg: z.number().nullable().optional(),
  counterpart_px: pixelPointSchema.nullable().optional(),
  separation_arcsec: z.number().nullable().optional(),
  apparent_motion_arcsec_yr: z.number().nullable().optional(),
})

const differenceCandidateSchema = z.object({
  candidate_id: z.string(),
  residual_type: z.enum([
    'positive_later_brighter',
    'negative_earlier_brighter',
  ]),
  ra_deg: z.number(),
  dec_deg: z.number(),
  png_x: z.number(),
  png_y: z.number(),
  target_px: pixelPointSchema,
  peak_residual_mjy_sr: z.number(),
  significance_sigma: z.number(),
  match: candidateMatchSchema,
})

export const differenceResponseSchema = z.object({
  diff_key: z.string(),
  difference_png_url: z.string(),
  // Optional v2.1 response extension supplied by the backend handoff.
  significance_png_url: z.string().min(1).optional(),
  early_date: z.string(),
  late_date: z.string(),
  shape_ny_nx: z.array(z.number()),
  target_px: pixelPointSchema,
  comparable_with: z.array(z.string()).optional(),
  candidates: z.array(differenceCandidateSchema),
})

export type ParsedDifferenceResponse = z.infer<typeof differenceResponseSchema> & DifferenceResponse

export function parseDifferenceJobResult(value: unknown): ParsedDifferenceResponse | null {
  const parsed = differenceResponseSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}
