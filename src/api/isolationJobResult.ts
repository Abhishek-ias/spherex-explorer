import { z } from 'zod'
import type { components } from '@/api/schema'

type IsolateResponse = components['schemas']['IsolateResponse']

const pixelPointSchema = z.object({
  x: z.number(),
  y: z.number(),
})

const sourceMeasurementSchema = z.object({
  object_id: z.string(),
  ra_deg: z.number(),
  dec_deg: z.number(),
  ra_hms: z.string(),
  dec_dms: z.string(),
  fits_x: z.number(),
  fits_y: z.number(),
  png_x: z.number(),
  png_y: z.number(),
  target_px: pixelPointSchema,
  flux_mjy_sr: z.number(),
  flux_err_mjy_sr: z.number(),
  background_mjy_sr: z.number(),
  snr: z.number(),
  quality_flag: z.number(),
  is_usable: z.boolean(),
  wavelength_um: z.number().nullable(),
  bandwidth_um: z.number().nullable(),
  date_obs: z.string(),
  detector: z.string(),
})

const isolatedEpochFrameSchema = z.object({
  isolated_png_url: z.string(),
  target_px: pixelPointSchema,
  source_measurement: sourceMeasurementSchema,
})

export const isolateResponseSchema = z.object({
  early_epoch_isolated: isolatedEpochFrameSchema,
  late_epoch_isolated: isolatedEpochFrameSchema,
  angular_displacement_arcsec: z.number(),
  time_baseline_days: z.number(),
  apparent_motion_arcsec_per_yr: z.number(),
})

export function parseIsolationJobResult(value: unknown): IsolateResponse | null {
  const parsed = isolateResponseSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}
