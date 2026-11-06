import { z } from 'zod'

export const emptyToNull = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    value => value === '' ? null : value,
    schema.nullable().optional()
  )
