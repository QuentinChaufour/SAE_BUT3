import { z } from 'zod/v4'

/**
 * A schema for validating the dossierId
 * From a string of digits to a number to a number
 */
export const dossierIdSchema = z.string()
  .trim()
  .nonempty('L\'identifiant de l\'étudiant est requis')
  .regex(/^\d+$/, 'L\'identifiant du dossier doit être un nombre')
  .transform(Number)

/**
 * A schema for validating the eventId
 * From a string of digits to a number to a number
 */
export const eventIdSchema = z.string()
  .trim()
  .regex(/^\d+$/, 'departementId must be a string of digits')
  .transform(Number)
