import { z } from 'zod/v4'
import { emptyToNull } from './utils'

export const contactSchema = z.object({
  nom: z.string()
    .trim()
    .nonoptional('Le nom est requis'),

  prenom: z.string()
    .trim()
    .nonoptional('Le prénom est requis'),

  email: emptyToNull(
    z.email('L\'email doit être valide').trim().optional()
  ),

  telephone: emptyToNull(
    z.string()
      .regex(/^(?:\+\d{1,3})?(?:\s*\d){10}$/, { message: 'Must be a valid international phone number' })
      .trim()
      .optional()
  ),

  fonction: z.string()
    .trim()
    .optional()
})

export const contactIdSchema = z.string()
  .trim()
  .regex(/^\d+$/, 'departementId must be a string of digits')
  .transform(Number)
