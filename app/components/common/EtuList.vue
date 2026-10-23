<script setup lang="ts">

defineProps<{
  annee?: string
  Tuteur?: {nom: string, prenom: string}
  Etu?: {nom: string, prenom: string}
  entreprise?: string
}>()

</script>

<template>
  <div class="grid grid-rows-1 grid-cols-6" >
    <p>{{ Etu?.prenom }}. {{ Etu?.nom }}</p>
    <p>{{ annee }}</p> <!-- Changer pas l'annee d'étude (3eme anne, 2eme annee, etc...)-->
    <p>{{ entreprise }}</p>
    <p>{{ Tuteur?.prenom }}. {{ Tuteur?.nom }}</p>
    <UIcon name="i-lucide-pencil" class="size-5 cursor-pointer hover:zoom-110 duration-300" />
    <UIcon name="i-lucide-chevron-right" class="size-5 cursor-pointer hover:zoom-110 duration-300" />
  </div>
</template>
