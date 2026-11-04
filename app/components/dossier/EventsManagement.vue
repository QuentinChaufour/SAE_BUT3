<script setup lang="ts">
import EventDescription from './EventDescription.vue';
import type { EventInfo } from '~~/shared/types/event'
// TODO documentation

const props = defineProps<{
  dossierId: number,
  events: EventInfo[]
}>()

const emits = defineEmits<{
  updated: []
}>()

const showEventDetails = ref<boolean>(false)
const selectedEvent = ref<EventInfo | null>(props.events[0] ?? null)

// events are already sorted by date on API side
// so we only need to reverse the order and not to sort them
const displayedEvents = computed(() => {
  return timelineReversed.value ? [...props.events].reverse() : props.events
})

const timelineReversed = ref<boolean>(false)

function onTimelineSelect(event: Event, item: EventInfo) {
  selectedEvent.value = item
  showEventDetails.value = true
}

function deleteEvent(event: EventInfo) {
  const index = props.events.findIndex(e => e.idDemarche === event.idDemarche)

  if (index !== -1) {
    props.events.splice(index, 1)
  }
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

    <slot name="header_action" />
  </div>

  <UTimeline
    :items="displayedEvents"
    @select="onTimelineSelect"
  />

  <USlideover
    :title="'Visualisation d\'un événement'"
    :size="'xl'"
    v-model:open="showEventDetails"
  >
    <template #body>
      <EventDescription
        v-if="selectedEvent"
        :dossier-id="props.dossierId"
        v-model="selectedEvent as EventInfo"
        @deleted="deleteEvent(selectedEvent as EventInfo)"
        @updated="emits('updated')"
        @close="showEventDetails = false"
      />
    </template>
  </USlideover>
</template>
