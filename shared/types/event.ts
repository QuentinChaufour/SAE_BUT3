import type { DemarcheEvenement, DemarcheContact, PieceJointe } from '~~/generated/prisma/client'
import type { TimelineItem } from '@nuxt/ui'

export type EventInfo = TimelineItem & Pick<DemarcheEvenement, 'description' | 'titre' | 'status' | 'source' | 'idDemarche'> & {
  date: string
} & {
  contacts?: DemarcheContact[],
  files?: Pick<PieceJointe, 'idPieceJointe' | 'nom'>[]
}