<script setup lang="ts">
const props = defineProps<{
  numEtu: string
  annee?: string
  tuteur?: { nom: string, prenom: string }
  etu?: { nom: string, prenom: string }
  entreprise?: string
}>()

async function navigateProfile() {
  await navigateTo(`/etudiants/${encodeURIComponent(props.numEtu)}`) // faire une redirection d'erreur
}

console.log(props.tuteur)
</script>

<template>
  <div class="grid grid-rows-1 grid-cols-6">
    <p>{{ etu?.prenom }}. {{ etu?.nom }}</p>
    <p>{{ annee }}</p> <!-- Changer pas l'annee d'étude (3eme anne, 2eme annee, etc...) -->
    <p>{{ entreprise }}</p>
    <p v-if="tuteur?.prenom != ''">
      {{ tuteur?.prenom }}. {{ tuteur?.nom }}
    </p>
    <p
      v-else
      class="text-mist-500/80"
    >
      <i>Libre</i>
    </p>
    <UIcon
      name="i-lucide-pencil"
      class="size-5 cursor-pointer hover:zoom-110 duration-300"
    />
    <UIcon
      name="i-lucide-chevron-right"
      class="size-5 cursor-pointer hover:zoom-110 duration-300"
      @click="navigateProfile"
    />
  </div>
</template>
