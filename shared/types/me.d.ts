interface APIConnectedStudent {
  idInscription: number
  annee: string
  readOnly: boolean
  formation: {
    nom: string
    departement: string
  }
}

interface APIConnectedPersonnel {
  annees: string[]
  departement: {
    id: number
    nom: string
  }
}
