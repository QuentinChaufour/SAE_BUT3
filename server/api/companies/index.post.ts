import { prisma } from '~~/server/utils/prisma'
import { z } from 'zod'

// TODO: Protéger la route

const bodySchema = z.object({
  nom: z.string().trim().nonempty(),
  nomEtab: z.string().trim().nonempty().optional().nullable(),
  adresse: z.string().trim().nonempty(),
  codePostal: z.string().trim().nonempty().optional().nullable(),
  ville: z.string().trim().nonempty(),
  siret: z.string().trim().nonempty().optional().nullable(),
  pays: z.string().trim().nonempty()
}).superRefine((data, ctx) => {
  const estFrance = data.pays.toLowerCase() === 'France'
  if (estFrance && !data.codePostal?.trim().length) {
    ctx.addIssue({
      code: 'custom',
      path: ['codePostal'],
      message: 'Le code postal est obligatoire en France.'
    })
  }
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const created = await prisma.entreprise.create({
    data: {
      nom: body.nom,
      nomEtab: body.nomEtab,
      adresse: body.adresse,
      codePostal: body.codePostal,
      ville: body.ville,
      siret: body.siret,
      pays: body.pays
    }
  })
  return created
})
