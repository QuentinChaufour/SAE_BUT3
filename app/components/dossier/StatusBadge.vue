<script setup lang="ts">
import { Recherche_Stage_Status } from '~~/generated/prisma/enums'

const props = defineProps<{
  status: Recherche_Stage_Status
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>()

const detailStatus = {
  [Recherche_Stage_Status.Accepte]: { label: 'Accepté', color: 'success' as const },
  [Recherche_Stage_Status.Abandon]: { label: 'Abandonné', color: 'error' as const },
  [Recherche_Stage_Status.AttenteEnvoi]: { label: 'En attente d\'envoi', color: 'neutral' as const },
  [Recherche_Stage_Status.Refuse]: { label: 'Refusé', color: 'warning' as const },
  [Recherche_Stage_Status.AttenteReponse]: { label: 'En attente de réponse', color: 'warning' as const },
  [Recherche_Stage_Status.Entretien]: { label: 'Entretien', color: 'info' as const }
}

const statusDetail = computed(() => detailStatus[props.status])
</script>

<template>
  <UBadge
    variant="subtle"
    :color="statusDetail.color"
    class="inline-flex items-center justify-center px-3 py-1"
    :size="props.size ?? 'md'"
  >
    {{ statusDetail.label }}
  </UBadge>
</template>