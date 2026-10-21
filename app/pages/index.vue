<script setup lang="ts">
definePageMeta({
  middleware: ['auth']
})
</script>

<template>
  <div>
    <slot />
  </div>
</template>
