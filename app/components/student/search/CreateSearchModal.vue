<script setup lang="ts">
const currentStep = ref(1)
const totalSteps = 3

const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}
</script>

<template>
  <UModal :title="'Ajouter une recherche'">
    <UButton icon="i-lucide-plus">
      Ajouter
    </UButton>

    <template #body>
      <div>
        <div v-if="currentStep === 1">
          <h1>Étape 1 : Informations généraleAAs</h1>
          <p>aaa</p>
          <!-- Contenu de l'étape 1 -->
        </div>
        <div v-if="currentStep === 2">
          <p>Étape 2 : Critères de recherche</p>
          <!-- Contenu de l'étape 2 -->
        </div>
        <div v-if="currentStep === 3">
          <p>Étape 3 : Confirmation</p>
          <!-- Contenu de l'étape 3 -->
        </div>
      </div>
    </template>

    <template #footer>
      <UButton
        :disabled="currentStep === 1"
        color="secondary"
        @click="previousStep"
      >
        Précédent
      </UButton>

      <UButton
        v-if="currentStep < totalSteps"
        @click="nextStep"
      >
        Suivant
      </UButton>
      <UButton
        v-else
        color="primary"
        @click="$emit('submit')"
      >
        Créer
      </UButton>
    </template>
  </UModal>
</template>
