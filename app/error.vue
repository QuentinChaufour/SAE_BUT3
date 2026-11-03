<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
</script>

<template>
  <UApp>
    <main class="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-gray-950">
      <UCard class="w-full max-w-lg text-center">
        <div class="flex flex-col items-center gap-6">
          <div
            class="flex size-20 items-center justify-center rounded-full bg-green-100 text-3xl font-bold text-green-700 dark:bg-green-950 dark:text-green-300"
          >
            {{ props.error.status }}
          </div>

          <div class="space-y-2">
            <h1 class="text-4xl font-bold text-gray-900 dark:text-white">
              Une erreur est survenue
            </h1>

            <p class="text-gray-600 dark:text-gray-400">
              {{ props.error.statusText || 'La page demandée est temporairement indisponible.' }}
            </p>
          </div>

          <UButton
            to="/"
            color="primary"
            icon="i-lucide-house"
          >
            Retour à l’accueil
          </UButton>
        </div>
      </UCard>
    </main>
  </UApp>
</template>
