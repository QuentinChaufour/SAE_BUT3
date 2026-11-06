<script setup lang="ts">
import { getRoleRedirectPath } from '~~/shared/const/redirect'

definePageMeta({
  middleware: ['auth']
})

const role = useUserSession().user.value?.role
await navigateTo(getRoleRedirectPath(role!))
</script>

<template>
  <div>
    <slot />
  </div>
</template>
