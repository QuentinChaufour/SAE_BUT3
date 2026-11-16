import { Recherche_Stage_Status } from '~~/generated/prisma/enums'

export const DetailStatus = {
  [Recherche_Stage_Status.Accepte]: { label: 'Accepté', color: 'success' as const },
  [Recherche_Stage_Status.Abandon]: { label: 'Abandonné', color: 'error' as const },
  [Recherche_Stage_Status.AttenteEnvoi]: { label: 'En attente d\'envoi', color: 'neutral' as const },
  [Recherche_Stage_Status.Refuse]: { label: 'Refusé', color: 'warning' as const },
  [Recherche_Stage_Status.AttenteReponse]: { label: 'En attente de réponse', color: 'warning' as const },
  [Recherche_Stage_Status.Entretien]: { label: 'Entretien', color: 'info' as const }
}
