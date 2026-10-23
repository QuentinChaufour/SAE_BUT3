import { z } from 'zod'

export const yearSchema = z.string().trim().nonempty('L\'année est requise.')
