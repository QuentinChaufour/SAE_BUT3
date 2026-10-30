import { z } from 'zod'

export const nomDepartementSchema = z
  .string()
  .min(3, 'Le nom du département doit contenir au moins 3 caractères.')
  .max(100, 'Le nom du département ne peut pas dépasser 100 caractères.')
  .trim()
