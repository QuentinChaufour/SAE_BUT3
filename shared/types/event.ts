import type { DemarcheEvenement, DemarcheContact, PieceJointe } from '~~/generated/prisma/client'

export type EventInfo = Pick<DemarcheEvenement, 'description' | 'titre' | 'status' | 'source' | 'idDemarche'> & {
  date: string
} & {
  contacts?: DemarcheContact[]
  files?: Pick<PieceJointe, 'idPieceJointe' | 'nom'>[]
}
