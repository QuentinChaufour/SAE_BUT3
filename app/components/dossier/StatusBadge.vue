<script setup lang="ts">
import type { Recherche_Stage_Status } from '~~/generated/prisma/enums'
import { DetailStatus } from '~/utils/RechercheStatusDetails'

const props = defineProps<{
  status: Recherche_Stage_Status
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>()

const statusDetail = computed(() => DetailStatus[props.status])
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
