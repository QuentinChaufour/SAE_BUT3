<script setup lang="ts">
import { useNow, useIntervalFn } from '@vueuse/core'
import { PX_PER_MINUTE } from '../../utils/layout'

const now = useNow({
  scheduler: callback => useIntervalFn(callback, 60_000),
})
const top = computed(() => (now.value.getHours() * 60 + now.value.getMinutes()) * PX_PER_MINUTE)
</script>

<template>
  <div
    class="absolute inset-x-0 z-10 border-t-2 border-error pointer-events-none"
    :style="{ top: `${top}px` }"
  >
    <div class="absolute -top-1.25 -inset-s-1 size-2 rounded-full bg-error" />
  </div>
</template>
