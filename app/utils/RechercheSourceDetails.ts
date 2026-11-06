import { Demarche_Source } from '~~/generated/prisma/enums'

export const DetailsSource = {
  [Demarche_Source.Telephone]: { label: 'Téléphone' },
  [Demarche_Source.Presentiel]: { label: 'Présentiel' },
  [Demarche_Source.Email]: { label: 'Email' },
  [Demarche_Source.Visio]: { label: 'Visioconférence' },
  [Demarche_Source.Autre]: { label: 'Autre' },
}
