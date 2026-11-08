import { z } from 'zod/v4'
import { emptyToNull } from './utils'

export const contactSchema = z.object({
  nom: z.string()
    .trim()
    .min(1, 'Le nom est requis')
    .nonoptional(),

  prenom: z.string()
    .trim()
    .optional(),

  email: emptyToNull(
    z.email('L\'email doit être valide').trim().optional()
  ),

  telephone: emptyToNull(
    z.string()
      .regex(/^(?:\+\d{1,3})?(?:\s*\d){10}$/, { message: 'Doit être un numéro de téléphone valide' })
      .trim()
      .optional()
  ),

  fonction: z.string()
    .trim()
    .optional(),

  idRecherche: z.number().nonoptional('L\'idRecherche est requis')
})

export const contactIdSchema = z.string()
  .trim()
  .regex(/^\d+$/, 'departementId must be a string of digits')
  .transform(Number)
