<script setup lang="ts">
const props = defineProps<{
  className: string
  alternance: boolean
  nbEtudiants: number
  nbStages: number
}>()
const progress = ref(+props.nbStages / +props.nbEtudiants)
</script>

<template>
  <UCard
    class="mx-2 my-1 flex-1 text-mist-950 dark:text-red-50"
    variant="subtle"
    :ui="{ body: 'sm:p-2' }"
  >
    <p class="text-lg text-gray-400 dark:text-gray-300 mb-1">
      {{ className }}{{ alternance ? ' alternance' : '' }}
    </p>
    <p>{{ nbEtudiants }} étudiants</p>
    <p>{{ nbStages }} {{ alternance ? 'alternances' : 'stages' }}</p>
    <UProgress
      v-model="progress"
      :max="1"
      class="h-0.5 my-1"
    />
  </UCard>
</template>
