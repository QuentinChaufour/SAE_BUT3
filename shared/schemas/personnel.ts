import { z } from 'zod'
import { Personnel_Role } from '~~/generated/prisma/client'

export const numPersonnelSchema = z.string().regex(/^p\d{1,12}$/m, 'Le numéro de personnel doit commencer par "p" suivi de 1 à 12 chiffres.')

export const personnelBodySchema = z.object({
  numPersonnel: numPersonnelSchema,
  nom: z.string().min(1, 'Le nom est requis.').max(100).trim(),
  prenom: z.string().min(1, 'Le prénom est requis.').max(100).trim(),
  role: z.enum(Personnel_Role, { message: 'Le rôle doit être soit "admin" soit "secretariat".' }),
  department_ids: z.array(z.number().int().positive()).optional()
})
