import { prisma } from '~~/server/utils/prisma'

import {
  type Enseignant,
  type Etudiant,
  type Personnel,
  type Entreprise,
  type TuteurEntreprise,
  type RechercheStage,
  type DepartementTag,
  type Stage,
  Personnel_Role,
  Recherche_Stage_Status,
  Demarche_Source
} from '~~/generated/prisma/client'

const ANNEE = '2026-2027'
const DATE_DEBUT = new Date('2026-09-01T00:00:00.000Z')
const DATE_FIN = new Date('2027-06-30T00:00:00.000Z')

defineRouteMeta({
  openAPI: {
    tags: ['dev'],
    description: 'Peupler la base de données avec des données de développement.',
    responses: {
      204: { description: 'OK' },
      403: { description: 'Forbidden' }
    }
  }
})

export default defineEventHandler(async (event) => {
  if (process.env.NODE_ENV !== 'development') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  await createYear()
  const departement = await createDepartement()
  const formation = await createFormation(departement.idDepartement)
  const enseignants = await createEnseignants()
  const etudiants = await createEtudiants()
  const personnels = await createPersonnels()

  await createAuth(enseignants, etudiants, personnels)
  await createAppartenances(departement.idDepartement, personnels)
  await createAnneeEnseignants(departement.idDepartement, enseignants)
  await createQuotas(departement.idDepartement, formation.idFormation, enseignants)
  await createInscriptions(formation.idFormation, etudiants)
  await createFavoris(enseignants, etudiants)

  const tags = await createTags(departement.idDepartement)
  const entreprises = await createEntreprises()
  const tuteurs = await createTuteurs(entreprises)
  const recherches = await createRecherches(entreprises, etudiants)

  await createDepartementTagRecherches(recherches, tags)
  await createDemarches(recherches)

  const stages = await createStages(tuteurs, enseignants, etudiants)
  await createSoutenances(stages, enseignants)

  return sendNoContent(event)
})

async function ensure<T>(
  find: () => Promise<T | null>,
  create: () => Promise<T>
): Promise<T> {
  const existing = await find()
  if (existing) return existing

  return create()
}

async function createYear() {
  return prisma.anneeUniversitaire.upsert({
    where: { annee: ANNEE },
    create: { annee: ANNEE },
    update: {}
  })
}

async function createDepartement() {
  return ensure(
    () => prisma.departement.findFirst({ where: { nom: 'Informatique' } }),
    () => prisma.departement.create({ data: { nom: 'Informatique', anneeActuelle: ANNEE } })
  )
}

async function createFormation(idDepartement: number) {
  const data = { nomFormation: 'BUT Informatique 3 - Initiaux', idDepartement, alternance: false }
  return ensure(
    () => prisma.formation.findFirst({ where: data }),
    () => prisma.formation.create({ data })
  )
}

async function createEnseignants() {
  const data = [
    { numEnseignant: 'p1001', nom: 'Martin', prenom: 'Claire', email: 'claire.martin@mail.fr' },
    { numEnseignant: 'p1002', nom: 'Bernard', prenom: 'Thomas', email: 'thomas.bernard@mail.fr' },
    { numEnseignant: 'p1003', nom: 'Petit', prenom: 'Sophie', email: 'sophie.petit@mail.fr' }
  ]

  return Promise.all(data.map(item => prisma.enseignant.upsert({
    where: { numEnseignant: item.numEnseignant },
    create: item,
    update: item
  })))
}

async function createEtudiants() {
  const data = [
    { numEtu: 'o12345678', nom: 'Durand', prenom: 'Lucas', email: 'lucas.durand@mail.fr' },
    { numEtu: 'o12345679', nom: 'Leroy', prenom: 'Emma', email: 'emma.leroy@mail.fr' },
    { numEtu: 'o12345670', nom: 'Moreau', prenom: 'Hugo', email: 'hugo.moreau@mail.fr' }
  ]

  return Promise.all(data.map(item => prisma.etudiant.upsert({
    where: { numEtu: item.numEtu },
    create: item,
    update: item
  })))
}

async function createPersonnels() {
  const data = [
    { numPersonnel: 'p9001', nom: 'Lefevre', prenom: 'Julie', email: 'julie.lefevre@mail.fr', role: Personnel_Role.admin },
    { numPersonnel: 'p9002', nom: 'Garcia', prenom: 'Paul', email: 'paul.garcia@mail.fr', role: Personnel_Role.secretariat }
  ]

  return Promise.all(data.map(item => prisma.personnel.upsert({
    where: { numPersonnel: item.numPersonnel },
    create: item,
    update: item
  })))
}

async function createAuth(enseignants: Enseignant[], etudiants: Etudiant[], personnels: Personnel[]) {
  const accounts = [
    ...enseignants.map(person => ({ login: person.numEnseignant, numEnseignant: person.numEnseignant })),
    ...etudiants.map(person => ({ login: person.numEtu, numEtu: person.numEtu })),
    ...personnels.map(person => ({ login: person.numPersonnel, numPersonnel: person.numPersonnel }))
  ]

  const password = await hashPassword('password')
  for (const account of accounts) {
    await prisma.auth.upsert({
      where: { login: account.login },
      create: { ...account, password },
      update: {}
    })
  }
}

async function createAppartenances(idDepartement: number, personnels: Personnel[]) {
  for (const [index, personnel] of personnels.entries()) {
    await ensure(
      () => prisma.appartenir.findFirst({ where: { numPersonnel: personnel.numPersonnel, idDepartement, dateDebut: DATE_DEBUT } }),
      () => prisma.appartenir.create({
        data: {
          numPersonnel: personnel.numPersonnel,
          idDepartement,
          dateDebut: DATE_DEBUT,
          dateFin: index === 0 ? null : DATE_FIN
        }
      })
    )
  }
}

async function createAnneeEnseignants(idDepartement: number, enseignants: Enseignant[]) {
  for (const enseignant of enseignants) {
    const data = { numEnseignant: enseignant.numEnseignant, idDepartement, annee: ANNEE }
    await prisma.anneeEnseignant.upsert({
      where: { numEnseignant_idDepartement_annee: data },
      create: data,
      update: {}
    })
  }
}

async function createQuotas(
  idDepartement: number,
  idFormation: number,
  enseignants: Enseignant[]
) {
  for (const [index, enseignant] of enseignants.entries()) {
    await prisma.quotaEnseignant.upsert({
      where: {
        numEnseignant_idDepartement_annee_idFormation: {
          numEnseignant: enseignant.numEnseignant,
          idDepartement,
          annee: ANNEE,
          idFormation
        }
      },
      create: {
        numEnseignant: enseignant.numEnseignant,
        idDepartement,
        annee: ANNEE,
        idFormation,
        quotaTuteurs: 5,
        quotaCandides: 8 + index * 2
      },
      update: { quotaTuteurs: 5, quotaCandides: 8 + index * 2 }
    })
  }
}

async function createInscriptions(idFormation: number, etudiants: Etudiant[]) {
  for (const [index, etudiant] of etudiants.entries()) {
    const data = { numEtu: etudiant.numEtu, idFormation, annee: ANNEE }
    await prisma.inscription.upsert({
      where: { numEtu_idFormation_annee: data },
      create: {
        ...data,
        dateInscription: new Date(`2026-09-0${index + 1}T00:00:00.000Z`)
      },
      update: {}
    })
  }
}

async function createFavoris(enseignants: Enseignant[], etudiants: Etudiant[]) {
  const pairs = [
    [enseignants[0], etudiants[0]],
    [enseignants[1], etudiants[1]],
    [enseignants[2], etudiants[2]]
  ] as const

  for (const [enseignant, etudiant] of pairs) {
    const data = { numEnseignant: enseignant!.numEnseignant, numEtu: etudiant!.numEtu, annee: ANNEE }
    await prisma.enseignantEtuFavori.upsert({
      where: { numEnseignant_numEtu_annee: data },
      create: data,
      update: {}
    })
  }
}

async function createTags(idDepartement: number) {
  const tags: DepartementTag[] = []
  for (const nomTag of ['Développement web', 'Backend', 'Réseaux']) {
    const data = { nomTag, idDepartement }
    tags.push(await ensure(
      () => prisma.departementTag.findFirst({ where: data }),
      () => prisma.departementTag.create({ data })
    ))
  }
  return tags
}

async function createDepartementTagRecherches(recherches: RechercheStage[], tags: DepartementTag[]) {
  const associations = [
    [recherches[0], tags[0]],
    [recherches[0], tags[1]],
    [recherches[1], tags[2]],
    [recherches[2], tags[0]]
  ] as const

  for (const [recherche, tag] of associations) {
    const data = { idRecherche: recherche!.idRecherche, idTag: tag!.idTag }
    await prisma.departementTagRecherche.upsert({
      where: { idRecherche_idTag: data },
      create: data,
      update: {}
    })
  }
}

async function createEntreprises() {
  const data = [
    {
      nom: 'Université d\'Orléans',
      nomEtab: 'IUT d\'Orléans',
      adresse: 'Rue d\'Issoudun',
      codePostal: '45100',
      ville: 'Orléans',
      pays: 'France',
      siret: null
    },
    {
      nom: 'TechPrise',
      nomEtab: null,
      adresse: '4 avenue de l’Europe',
      codePostal: '80000',
      ville: 'Amiens',
      pays: 'France',
      siret: '1'.repeat(14)
    }
  ]

  const result: Entreprise[] = []
  for (const item of data) {
    result.push(await ensure(
      () => prisma.entreprise.findFirst({ where: { nom: item.nom, ville: item.ville } }),
      () => prisma.entreprise.create({ data: item })
    ))
  }
  return result
}

async function createTuteurs(entreprises: Entreprise[]) {
  const data = [
    { nom: 'Roux', prenom: 'Nicolas', telephone: '0600000001', email: 'nicolas.roux@mail.fr', idEntreprise: entreprises[0]!.idEntreprise },
    { nom: 'Leroy', prenom: 'Pauline', telephone: '0600000002', email: 'pauline.leroy@mail.fr', idEntreprise: entreprises[1]!.idEntreprise }
  ]

  const result: TuteurEntreprise[] = []
  for (const item of data) {
    result.push(await ensure(
      () => prisma.tuteurEntreprise.findFirst({ where: { email: item.email } }),
      () => prisma.tuteurEntreprise.create({ data: item })
    ))
  }
  return result
}

async function createRecherches(entreprises: Entreprise[], etudiants: Etudiant[]) {
  const data = [
    {
      titre: 'Développeur back-end',
      description: 'Développement d\'une API REST en TypeScript',
      alternance: false,
      idEntreprise: entreprises[0]!.idEntreprise,
      numEtu: etudiants[0]!.numEtu,
      annee: ANNEE,
      status: Recherche_Stage_Status.Entretien
    },
    {
      titre: 'Développeur web',
      description: 'Développement d\'une application web en Vue.js',
      alternance: false,
      idEntreprise: entreprises[1]!.idEntreprise,
      numEtu: etudiants[1]!.numEtu,
      annee: ANNEE,
      status: Recherche_Stage_Status.AttenteReponse
    },
    {
      titre: 'Stage conception BDD',
      description: 'Conception et sécurisation d\'une base de données.',
      alternance: true,
      idEntreprise: entreprises[0]!.idEntreprise,
      numEtu: etudiants[2]!.numEtu,
      annee: ANNEE,
      status: Recherche_Stage_Status.AttenteEnvoi
    }
  ]

  const result: RechercheStage[] = []
  for (const item of data) {
    result.push(await ensure(
      () => prisma.rechercheStage.findFirst({ where: { titre: item.titre, numEtu: item.numEtu, annee: ANNEE } }),
      () => prisma.rechercheStage.create({ data: item })
    ))
  }
  return result
}

async function createDemarches(recherches: RechercheStage[]) {
  const contact = await ensure(
    () => prisma.demarcheContact.findFirst({ where: { email: 'contact@entreprise.fr' } }),
    () => prisma.demarcheContact.create({
      data: {
        nom: 'Roux',
        prenom: 'Nicolas',
        fonction: 'Gérant',
        email: 'contact@entreprise.fr',
        telephone: '0607080910'
      }
    })
  )

  const evenements = [
    { idRecherche: recherches[0]!.idRecherche, description: 'Envoi candidature par mail', status: Recherche_Stage_Status.AttenteReponse, source: Demarche_Source.Email },
    { idRecherche: recherches[0]!.idRecherche, description: 'Entretien Teams', status: Recherche_Stage_Status.Entretien, source: Demarche_Source.Telephone },
    { idRecherche: recherches[1]!.idRecherche, description: 'Dépôt candidature en main propre', status: Recherche_Stage_Status.AttenteReponse, source: Demarche_Source.Presentiel }
  ]

  for (const [index, item] of evenements.entries()) {
    const evenement = await ensure(
      () => prisma.demarcheEvenement.findFirst({ where: { idRecherche: item.idRecherche, description: item.description } }),
      () => prisma.demarcheEvenement.create({ data: item })
    )

    const data = { idDemarche: evenement.idDemarche, idContact: contact.idContact }
    await prisma.demarcheRechercheContact.upsert({
      where: { idDemarche_idContact: data },
      create: data,
      update: {}
    })

    if (index === 0) {
      const piece = await ensure(
        () => prisma.pieceJointe.findFirst({ where: { nom: 'CV.pdf' } }),
        () => prisma.pieceJointe.create({ data: { nom: 'CV.pdf', chemin: '/uploads/CV.pdf' } })
      )

      const pjData = { idPieceJointe: piece.idPieceJointe, idDemarche: evenement.idDemarche }
      await prisma.lienPj.upsert({
        where: { idPieceJointe_idDemarche: pjData },
        create: pjData,
        update: {}
      })
    }
  }
}

async function createStages(tuteurs: TuteurEntreprise[], enseignants: Enseignant[], etudiants: Etudiant[]) {
  const data = [
    {
      titre: 'Application de gestion de stages',
      description: 'Conception et développement d\'une application web pour la gestion des stages.',
      dateDebut: new Date('2027-04-05T00:00:00.000Z'),
      dateFin: new Date('2027-06-25T00:00:00.000Z'),
      type: false,
      confidentielle: false,
      numEtu: etudiants[0]!.numEtu,
      idTuteurEntreprise: tuteurs[0]!.idTuteurEntreprise,
      annee: ANNEE,
      numEnseignant: enseignants[0]!.numEnseignant
    },
    {
      titre: 'Site web vitrine',
      description: 'Réalisation d\'un site web vitrine pour une entreprise du numérique.',
      dateDebut: new Date('2027-04-05T00:00:00.000Z'),
      dateFin: new Date('2027-06-25T00:00:00.000Z'),
      type: false,
      confidentielle: false,
      numEtu: etudiants[1]!.numEtu,
      idTuteurEntreprise: tuteurs[1]!.idTuteurEntreprise,
      annee: ANNEE,
      numEnseignant: enseignants[1]!.numEnseignant
    }
  ]

  const result: Stage[] = []
  for (const item of data) {
    const stage = await ensure(
      () => prisma.stage.findFirst({ where: { titre: item.titre, numEtu: item.numEtu, annee: ANNEE } }),
      () => prisma.stage.create({ data: item })
    )
    result.push(stage)

    const data = { idStage: stage.idStage, numEnseignant: item.numEnseignant }
    await prisma.propositionTuteurUniv.upsert({
      where: { idStage_numEnseignant: data },
      create: data,
      update: {}
    })
  }
  return result
}

async function createSoutenances(stages: Stage[], enseignants: Enseignant[]) {
  const data = { nomSalle: 'I001', batiment: 'Bâtiment Info' }
  const salle = await ensure(
    () => prisma.salle.findFirst({ where: data }),
    () => prisma.salle.create({ data })
  )

  const soutenance = await ensure(
    () => prisma.soutenance.findFirst({ where: { annee: ANNEE, idSalle: salle.idSalle, dateDebut: new Date('2027-06-28T00:00:00.000Z') } }),
    () => prisma.soutenance.create({
      data: {
        dateDebut: new Date('2027-06-28T00:00:00.000Z'),
        dateFin: new Date('2027-06-28T00:00:00.000Z'),
        idSalle: salle.idSalle,
        annee: ANNEE
      }
    })
  )

  for (const enseignant of enseignants.slice(0, 2)) {
    const data = { idSoutenance: soutenance.idSoutenance, numEnseignant: enseignant.numEnseignant }
    await prisma.enseignantSoutenance.upsert({
      where: { idSoutenance_numEnseignant: data },
      create: data,
      update: {}
    })
  }

  for (const stage of stages) {
    const data = { idSoutenance: soutenance.idSoutenance, idStage: stage.idStage }
    await prisma.soutenanceStage.upsert({
      where: { idSoutenance_idStage: data },
      create: data,
      update: {}
    })
  }
}
