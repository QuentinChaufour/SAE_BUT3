import { z } from 'zod'

const PersonnelRole = {
  admin: 'admin',
  secretariat: 'secretariat'
} as const

export const numPersonnelSchema = z.string().regex(/^p\d{1,12}$/m, 'Le numéro de personnel doit commencer par "p" suivi de 1 à 12 chiffres.')

export const personnelNameSchema = z.string().min(2, 'Le nom est requis.').max(50).trim()
export const personnelFirstNameSchema = z.string().min(2, 'Le prénom est requis.').max(50).trim()

export const personnelBodySchema = z.object({
  numPersonnel: numPersonnelSchema,
  nom: personnelNameSchema,
  prenom: personnelFirstNameSchema,
  email: z.email('L\'email doit être valide.').max(100).optional(),
  role: z.enum(PersonnelRole, { message: 'Le rôle doit être soit "admin" soit "secretariat".' }),
  department_ids: z.array(z.number().int().positive()).optional()
})

export const personnelUpdateBodySchema = z.object({
  nom: personnelNameSchema.optional(),
  prenom: personnelFirstNameSchema.optional(),
  email: z.email('L\'email doit être valide.').max(100).optional()
})
