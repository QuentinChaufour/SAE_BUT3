import { checkAuth } from '~~/server/utils/middleware'
import { prisma } from '~~/server/utils/prisma'
import { companyFields } from '~~/shared/schemas/company.ts'
import UserRole from '~~/shared/types/role'

export default defineEventHandler(async (event) => {
  await checkAuth(event, [UserRole.Student])

  const body = await readValidatedBody(event, companyFields.parse)
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
