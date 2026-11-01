import { z } from 'zod'
import { Personnel_Role } from '~~/generated/prisma/client'

export const numPersonnelSchema = z
  .string()
  .min(1, 'Le numéro du personnel est requis.')
  .trim()

export const personnelBodySchema = z.object({
  numPersonnel: numPersonnelSchema,
  nom: z.string().min(1, 'Le nom est requis.').max(100).trim(),
  prenom: z.string().min(1, 'Le prénom est requis.').max(100).trim(),
  role: z.enum(Personnel_Role, { message: 'Le rôle doit être soit "admin" soit "secretariat".' }),
  department_ids: z.array(z.number().int().positive()).optional()
})
