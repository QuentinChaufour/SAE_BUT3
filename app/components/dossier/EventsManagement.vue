<script setup lang="ts">
import type { TimelineItem } from '@nuxt/ui'
// TODO documentation

const { events } = defineProps<{
  events: TimelineItem[]
}>()

const showEventDetails = ref<boolean>(false)

// events are already sorted by date on API side
// so we only need to reverse the order and not to sort them
const displayedEvents = computed(() => {
  return timelineReversed.value ? [...events].reverse() : events
})

const timelineReversed = ref<boolean>(false)

function onTimelineSelect(event: Event, item: TimelineItem) {
  showEventDetails.value = true
}

// TODO slot for event creation
</script>

<template>
  <div class="flex flex-row justify-between gap-5 mb-4">
    <UButton @click="timelineReversed = !timelineReversed">
      <div class="flex items-center">
        <UIcon
          :name="timelineReversed ? 'i-lucide-arrow-down' : 'i-lucide-arrow-up'"
          class="w-4 h-4 mr-1"
        />
        Trier par date
      </div>
    </UButton>

    <UButton>
      <div class="flex items-center">
        <UIcon
          name="i-lucide-plus"
          class="w-4 h-4 mr-1"
        />
        Ajouter un événement
      </div>
    </UButton>
  </div>

  <UTimeline
    :items="displayedEvents"
    @select="onTimelineSelect"
  />

  <USlideover
    :title="'Visualisation d\'un événement'"
    :size="'md'"
    v-model:open="showEventDetails"
  >
    <placeholder>
      <div class="flex flex-col items-center justify-center min-h-screen min-w-full">
        <UButton to="student/search">
          Retour
        </UButton>
        <p class="text-lg font-semibold mt-4">
          Chargement de l'événement...
        </p>
      </div>
    </placeholder>
  </USlideover>
</template>
