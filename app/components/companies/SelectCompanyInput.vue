<script lang="ts" setup>
import type { Entreprise } from '~~/generated/prisma/client'
import { refDebounced } from '@vueuse/core'
import CreateCompanyModal from './CreateCompanyModal.vue'

const idEntreprise = defineModel<number | undefined>('idEntreprise')

type Company = Pick<Entreprise, 'idEntreprise' | 'nom' | 'ville' | 'codePostal'>

interface CompanyItem {
  label: string
  city?: string | null
  codePostal?: string | null
  value: number
}

const searchTerm = ref<string>('')
const searchTermDebounced = refDebounced(searchTerm, 300)
const selectedCompany = ref<CompanyItem>()
const pendingCompanyName = ref<string>('')

const inputMenuKey = ref(0)

const isOpen = ref(false)
const isOpenCreateCompanyModal = ref(false)

const { data: companies, status, execute } = await useLazyFetch('/api/companies', {
  key: 'companies-name-city',
  query: { search: searchTermDebounced },
  transform: (data: Company[]) => {
    return data.map(toCompanyItem)
  },
  immediate: false,
  watch: false
})

watch(searchTermDebounced, (search) => {
  if (!search.trim()) {
    companies.value = []
    return
  }

  execute()
})

const companyItems = computed<CompanyItem[]>(() => {
  if (!searchTerm.value) return selectedCompany.value ? [selectedCompany.value] : []

  return companies.value ?? []
})

watch(selectedCompany, (company) => {
  idEntreprise.value = company?.value
})

function toCompanyItem(company: Company): CompanyItem {
  return {
    label: company.nom,
    city: company.ville,
    codePostal: company.codePostal,
    value: company.idEntreprise
  }
}

function displayCity(item: CompanyItem) {
  if (!item.city) return ''

  if (!item.codePostal) return item.city

  return `${item.city} (${item.codePostal})`
}

function createCompany() {
  pendingCompanyName.value = searchTerm.value
  searchTerm.value = ''

  isOpen.value = false
  inputMenuKey.value++
  isOpenCreateCompanyModal.value = true
}

function onEnterpriseCreated(entreprise: Entreprise) {
  const companyItem = toCompanyItem(entreprise)

  companies.value = [
    companyItem,
    ...(companies.value ?? []).filter(company => company.value !== companyItem.value)
  ]

  selectedCompany.value = companyItem
  inputMenuKey.value++
}
</script>

<template>
  <UInputMenu
    :key="inputMenuKey"
    v-model="selectedCompany"
    v-model:open="isOpen"
    v-model:search-term="searchTerm"
    :items="companyItems"
    :loading="status === 'pending'"
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

  <CreateCompanyModal
    v-model:open="isOpenCreateCompanyModal"
    :initial-nom-entreprise="pendingCompanyName"
    @created="onEnterpriseCreated"
  />
</template>
