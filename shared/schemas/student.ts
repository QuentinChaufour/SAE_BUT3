import { z } from 'zod'

export const studentIdSchema = z.string().trim().nonempty('Le numéro étudiant est requis.').max(10, 'Le numéro étudiant ne peut pas dépasser 10 caractères.')
