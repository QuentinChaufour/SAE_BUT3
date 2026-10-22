import { z } from 'zod'

export const studentSearchFields = z.object({
  titre: z.string().trim().min(5, 'Le titre doit faire au moins 5 caractères.').max(100, 'Le titre ne peut pas dépasser 100 caractères.'),
  description: z.string().trim().max(2000, 'La description ne peut pas dépasser 2000 caractères.').optional(),
  alternance: z.boolean().nonoptional(),
  idEntreprise: z.number('L\'entreprise est requise.').nonoptional()
})
