import type { DemarcheEvenement, DemarcheContact } from '~~/generated/prisma/client'

export interface EventFile { 
  id: string
  name: string
  size?: number
  type?: string 
}

export type EventInfo = Pick<DemarcheEvenement, 'description' | 'titre' | 'status' | 'source' | 'idDemarche'> & {
  date: string
} & {
  contacts?: DemarcheContact[]
  files?: EventFile[]
}
