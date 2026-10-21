<script lang="ts" setup>
import type { Entreprise } from '~~/generated/prisma/client'
import { refDebounced } from '@vueuse/core'

const idEntreprise = defineModel<number | undefined>('idEntreprise')

type Company = Pick<Entreprise, 'idEntreprise' | 'nom' | 'ville' | 'codePostal'>

interface CompanyItem {
  label: string
  city?: string | null
  codePostal?: string | null
  value: number
}

const emit = defineEmits<{
  createCompany: []
}>()

const searchTerm = ref('')
const searchTermDebounced = refDebounced(searchTerm, 300)
const isOpen = ref(false)

const { data: companies, status } = await useLazyFetch('/api/companies', {
  key: 'companies-name-city',
  query: { search: searchTermDebounced },
  transform: (data: Company[]) => {
    return data?.map(company => ({
      label: company.nom,
      city: company.ville,
      codePostal: company.codePostal,
      value: company.idEntreprise
    }))
  },
  immediate: false
})

function displayCity(item: CompanyItem) {
  if (!item.city) return ''

  if (!item.codePostal) return item.city

  return `${item.city} (${item.codePostal})`
}

function createCompany() {
  isOpen.value = false
  emit('createCompany')
}
</script>

<template>
  <UInputMenu
    v-model="idEntreprise"
    v-model:open="isOpen"
    v-model:search-term="searchTerm"
    :items="companies ?? []"
    :loading="status === 'pending'"
    value-key="value"
    ignore-filter
    placeholder="Sélectionner une entreprise"
    class="w-full"
    create-item="always"
    @create="createCompany"
  >
    <template #item-label="{ item }">
      {{ item.label }}

      <span class="text-muted">
        {{ displayCity(item) }}
      </span>
    </template>

    <template #create-item-label="{ item }">
      Créer l'entreprise "{{ item }}"
    </template>

    <template #empty>
      Aucune entreprise trouvée.
    </template>
  </UInputMenu>
</template>
