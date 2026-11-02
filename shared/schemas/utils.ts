import { z } from 'zod/v4'

export const emptyToNull = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    value => value === '' ? null : value,
    schema.nullable().optional()
  )
