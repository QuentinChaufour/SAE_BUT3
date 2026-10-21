<script setup lang="ts">
import type { EntrepriseStateType } from '../CreateCompanyModal.vue'

const toast = useToast()

interface RechercheEntrepriseAPIResponse {
  results: {
    nom_complet: string
    siege: {
      code_postal: string
      libelle_commune: string
      libelle_voie: string
      type_voie: string
      numero_voie: string
      siret: string
      libelle_pays_etranger: string
    }
    matching_etablissements: {
      liste_enseignes: string[]
    }[]
  }[]
}

const emit = defineEmits<{
  found: [entreprise: EntrepriseStateType]
}>()

const siret = ref<string>('')

async function searchSiret() {
  const cleanSiret = siret.value.replaceAll(' ', '')
  if (cleanSiret.length !== 14) {
    toast.add({ title: 'Erreur', description: `Le SIRET doit contenir 14 chiffres.`, color: 'error' })
    return
  }

  if (!/^\d+$/.test(cleanSiret)) {
    toast.add({ title: 'Erreur', description: `Le SIRET ne doit contenir que des chiffres.`, color: 'error' })
    return
  }

  try {
    const response = await $fetch<RechercheEntrepriseAPIResponse>(`https://recherche-entreprises.api.gouv.fr/search`, {
      query: { q: cleanSiret, per_page: 1 }
    })

    if (!response.results.length || response.results[0] === undefined) {
      toast.add({ title: 'Erreur', description: `Aucune entreprise trouvée avec le SIRET "${cleanSiret}"`, color: 'error' })
      return
    }

    const entrepriseData = response.results[0]
    if (entrepriseData.nom_complet === '[NON-DIFFUSIBLE]') {
      toast.add({ title: 'Erreur', description: `Les données de l'entreprise pour le SIRET "${cleanSiret}" sont non diffusibles.`, color: 'error' })
      return
    }

    const entreprise: EntrepriseStateType = {
      nom: entrepriseData.nom_complet,
      nomEtab: entrepriseData.matching_etablissements[0]?.liste_enseignes?.[0] ?? '',
      adresse: [entrepriseData.siege.numero_voie, entrepriseData.siege.type_voie, entrepriseData.siege.libelle_voie].filter(Boolean).join(' '),
      ville: entrepriseData.siege.libelle_commune,
      codePostal: entrepriseData.siege.code_postal,
      siret: entrepriseData.siege.siret,
      pays: entrepriseData.siege.libelle_pays_etranger ?? 'France'
    }

    emit('found', entreprise)
  } catch (error) {
    console.error('Erreur lors de la recherche du SIRET :', error)
    toast.add({ title: 'Erreur', description: `Une erreur s'est produite lors de la recherche du SIRET "${cleanSiret}".`, color: 'error' })
  }
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <UForm class="flex gap-3">
      <UFormField
        label="Préremplir avec le SIRET"
        name="siret"
      >
        <template #description>
          Vous pouvez récupérer le numéro de SIRET d'une entreprise française sur le site de l'État : <ULink
            to="https://annuaire-entreprises.data.gouv.fr/"
            target="_blank"
            color="primary"
          >https://annuaire-entreprises.data.gouv.fr/</ULink>.
        </template>

        <div class="flex items-end gap-2">
          <UInput
            v-model="siret"
            placeholder="123 456 789 01234"
            :minlength="14"
            :maxlength="17"
            required
            class="flex-1"
          />

          <UButton
            color="primary"
            class="mt-2"
            icon="i-lucide-search"
            :disabled="siret.length < 14"
            @click="searchSiret"
          />
        </div>
      </UFormField>
    </UForm>
  </div>
</template>
