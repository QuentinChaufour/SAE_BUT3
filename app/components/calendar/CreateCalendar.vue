<script setup lang="ts">
import { parseDate } from '@internationalized/date'
import type { TabsItem } from '@nuxt/ui'
import { useCalendar } from '../../composables/useCalendar'
import type { CalendarView } from '../../../shared/types'

definePageMeta({
  // Date changes update the mounted view in place, the default key would
  // remount the page (and reset the month view scroll) on every URL sync
  key: route => route.params.view as string,
  validate(route) {
    if (!['day', 'week'].includes(route.params.view as string)) {
      return false
    }

    try {
      parseDate(route.params.date as string)
      return true
    } catch {
      return false
    }
  },
})


const { view, date, title, monthLabelsVisible, pathFor } = useCalendar()

const views = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' }
] satisfies TabsItem[]

function onViewChange(value: string | number) {
  navigateTo(pathFor(date.value, value as CalendarView))
}
</script>

<template>

    <header class="absolute top-0 pt-2 inset-x-0 z-10 flex items-center gap-2 sm:gap-4 h-[calc(var(--ui-header-height)+0.5rem)] px-4 border-b border-default glass-material [view-transition-name:header]">

      <div class="pointer-events-none absolute inset-0 -z-10 bg-(--glass-bg) bg-linear-to-b from-default from-40% to-transparent" />

      <div class="flex items-center gap-2 min-w-0 flex-1">
        <h1
          ref="heading"
          class="flex items-baseline gap-1.5 text-xl sm:text-2xl tracking-tight min-w-0 flex-1 transition-opacity duration-0"
          :class="view === 'month' && monthLabelsVisible ? 'opacity-0 delay-150' : 'opacity-100'"
        >
          <span class="font-bold text-highlighted truncate">{{ title.months }}</span>
          <span class="font-normal text-muted hidden sm:inline">{{ title.year }}</span>
        </h1>
      </div>

      <!-- Down to the initial below `sm`, where the header cannot spare the
        width for the labels, each in a 24px circle with the track hugging
        them. On a touch screen the track pads out to stand as tall as the
        buttons beside it --> <!-- A garder pour changer de pov-->
      <UTabs
        :items="views"
        :content="false"
        :model-value="view"
        color="neutral"
        size="sm"
        class="mx-auto sm:w-52 sm:pointer-coarse:w-56 lg:w-60"
        :ui="{
          list: 'max-sm:pointer-coarse:p-1.5',
          indicator: 'max-sm:pointer-coarse:inset-y-1.5',
          trigger: 'p-1 lg:p-1.5 max-sm:size-6 max-sm:p-0 max-sm:grow-0 max-sm:justify-center'
        }"
        @update:model-value="onViewChange"
      >
        <template #default="{ item }">
          <span class="sm:hidden">{{ item.label.charAt(0) }}</span>
          <span class="hidden sm:inline">{{ item.label }}</span>
        </template>
      </UTabs>

      <div class="flex items-center gap-2 md:flex-1 justify-end">
      </div>

    </header>

  <div class="flex-1 flex flex-col min-h-0">
    <CalendarWeekView />
  </div>

</template>
