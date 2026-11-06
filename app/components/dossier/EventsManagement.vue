<script setup lang="ts">
import EventDescription from '~/components/dossier/EventDescription.vue';
import StatusBadge from '~/components/dossier/StatusBadge.vue';
import type { TimelineItem } from '@nuxt/ui'
import type { EventInfo } from '~~/shared/types/event'
// TODO documentation

const props = defineProps<{
  dossierId: number,
  events: EventInfo[]
}>()

const emits = defineEmits<{
  updated: [EventInfo]
  deleted: [EventInfo]
}>()

const emitDeleted = emits as unknown as (event: 'deleted', payload: EventInfo) => void

const showEventDetails = ref<boolean>(false)
const selectedEvent = ref<EventInfo | null>(props.events[0] ?? null)

// events are already sorted by date on API side
// so we only need to reverse the order and not to sort them
const displayedEvents = computed(() => {
  return timelineReversed.value ? [...props.events].reverse() : props.events
})

const timelineReversed = ref<boolean>(false)

function onTimelineSelect(_: Event, item: EventInfo) {
  selectedEvent.value = item
  showEventDetails.value = true
}

function deleteEvent() {

  if(!selectedEvent.value) {
    return
  }

  emits('deleted', selectedEvent.value as EventInfo)
  showEventDetails.value = false
}

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
    v-if="displayedEvents.length > 0"
    :items="displayedEvents.map(event => ({
      ...event,
      title: event.titre || 'Pas de titre',
      description: event.description || '',
      icon: '',
    } satisfies TimelineItem & EventInfo))"
    @select="onTimelineSelect"
    :ui="{
      item: 'cursor-pointer'
    }"
  >
    <template #title="{ item }">
      <div class="flex flex-row gap-2 items-center justify-between">
        <p>
          {{ item.title }}
        </p>
        <div class="flex items-center gap-2">
          <StatusBadge
            :status="(item as EventInfo).status ?? 'AttenteEnvoi'"
            class="text-xs"
          />
          <UIcon
            name="i-lucide-chevron-right"
            class="size-5 text-muted"
            aria-hidden="true"
          />
        </div>
      </div>
    </template>
  </UTimeline>
  <div v-else class="emptyDataPlaceholder">
    <p class="text-sm text-gray-500">
      Aucun événement à afficher.
    </p>
  </div>

  <USlideover
    :title="'Visualisation d\'un événement'"
    class="slidingModal"
    v-model:open="showEventDetails"
  >
    <template #body>
      <EventDescription
        v-if="selectedEvent"
        :dossier-id="props.dossierId"
        :event="selectedEvent as EventInfo"
        @deleted="deleteEvent"
        @updated="emits('updated', $event)"
        @close="showEventDetails = false"
      />
    </template>
  </USlideover>
</template>
