import { z } from 'zod'
import { emptyToNull } from './utils'

export const companyFields = z.object({
  nom: z.string().trim().min(2, 'Le nom de l\'entreprise doit faire au moins 2 caractères.').max(100, 'Le nom de l\'entreprise ne peut pas dépasser 100 caractères.'),
  nomEtab: emptyToNull(z.string().trim().max(100, 'Le nom de l\'établissement ne peut pas dépasser 100 caractères.')),
  siret: emptyToNull(z.string().trim().length(14, 'Le SIRET doit contenir exactement 14 chiffres.')),
  pays: z.string().trim().nonempty('Le nom du pays est obligatoire.').max(100, 'Le nom du pays ne peut pas dépasser 100 caractères.'),
  adresse: z.string().nonempty('L\'adresse est obligatoire.').max(200, 'L\'adresse ne peut pas dépasser 200 caractères.'),
  ville: z.string().trim().nonempty('La ville est obligatoire.').max(100, 'La ville ne peut pas dépasser 100 caractères.'),
  codePostal: emptyToNull(z.string().trim().max(10, 'Le code postal ne peut pas dépasser 10 caractères.'))
}).superRefine((data, ctx) => {
  const estFrance = data.pays.toLowerCase() === 'france'
  if (estFrance) {
    if (!data.codePostal?.trim().length) {
      ctx.addIssue({
        code: 'custom',
        path: ['codePostal'],
        message: 'Le code postal est obligatoire en France.'
      })
      return
    }

    if (!/^\d{5}$/.test(data.codePostal)) {
      ctx.addIssue({
        code: 'custom',
        path: ['codePostal'],
        message: 'Le code postal doit contenir exactement 5 chiffres pour la France.'
      })
      return
    }
  }
})
