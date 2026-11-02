import { z } from 'zod/v4'

export const studentIdSchema = z.string()
  .trim()
  .nonempty('L\'identifiant de l\'étudiant est requis')
