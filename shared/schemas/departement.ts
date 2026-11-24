import { z } from 'zod/v4'

/**
 * A schema for validating a department ID.
 * From a string param to a number, ensuring it consists only of digits.
 */
export const departementIdSchema = z.string()
  .trim()
  .regex(/^\d+$/, 'departementId must be a string of digits')
  .transform(Number)
