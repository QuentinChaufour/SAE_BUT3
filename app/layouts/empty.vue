<script setup lang="ts">
declare module 'nuxt/app' {
  interface NuxtLayouts {
    empty: unknown
  }
}
</script>

<template>
  <div>
    <slot />
  </div>
</template>
