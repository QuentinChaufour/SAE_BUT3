import type { DemarcheContact } from '~~/generated/prisma/client'
import type { AccordionItem } from '@nuxt/ui'

export type ContactInfo = AccordionItem & DemarcheContact
