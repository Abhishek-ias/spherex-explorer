import { z } from 'zod'

export const searchParamsSchema = z.object({
  ra: z.string().min(1, 'RA is required.').transform(Number).pipe(
    z.number().finite().min(0).lt(360, 'RA must be at least 0° and less than 360°.'),
  ),
  dec: z.string().min(1, 'Declination is required.').transform(Number).pipe(
    z.number().finite().min(-90, 'Declination must be at least −90°.')
      .max(90, 'Declination must be no greater than +90°.'),
  ),
  fov: z.string().min(1, 'Field of view is required.').transform(Number).pipe(
    z.number().refine(
      (value) => [5, 15, 30, 60].includes(value),
      'Field of view must be 5, 15, 30, or 60 arcmin.',
    ),
  ),
})

export type SearchParams = z.infer<typeof searchParamsSchema>
