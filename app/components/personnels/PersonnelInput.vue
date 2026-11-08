<script lang="ts" setup>
import { refDebounced } from '@vueuse/core'

export interface PersonnelOption {
  numPersonnel: string
  nom: string
  prenom: string
  email: string | null
  existing: boolean
}

type PersonnelApi = Pick<PersonnelOption, 'numPersonnel' | 'nom' | 'prenom' | 'email'>

const props = defineProps<{ role?: string }>()

const numPersonnel = defineModel<string>({ default: '' })

const open = ref(false)

const emit = defineEmits<{
  select: [personnel: PersonnelOption | null]
}>()

const searchTerm = ref('')
const searchTermDebounced = refDebounced(searchTerm, 300)
const selected = ref<PersonnelOption>()

const { data: personnels, status, execute } = await useLazyFetch('/api/personnels', {
  key: 'personnels-search',
  query: { search: searchTermDebounced, role: toRef(props, 'role') },
  transform: (data: PersonnelApi[]) => data.map(toItem),
  immediate: false,
  watch: false
})

watch(searchTermDebounced, (search) => {
  if (!search.trim()) {
    personnels.value = []
    return
  }

  execute()
})

const items = computed<PersonnelOption[]>(() => {
  if (!searchTerm.value) return selected.value ? [selected.value] : []
  return personnels.value ?? []
})

watch(selected, (item) => {
  numPersonnel.value = item?.numPersonnel ?? ''
  emit('select', item ? toOption(item) : null)
})

function toItem(personnel: PersonnelApi): PersonnelOption {
  return {
    numPersonnel: personnel.numPersonnel,
    nom: personnel.nom,
    prenom: personnel.prenom,
    email: personnel.email,
    existing: true
  }
}

function toOption({ numPersonnel, nom, prenom, email, existing }: PersonnelOption): PersonnelOption {
  return { numPersonnel, nom, prenom, email, existing }
}

function onCreate(search: string) {
  const value = search.trim()
  if (!value) return

  selected.value = {
    numPersonnel: value,
    nom: '',
    prenom: '',
    email: '',
    existing: false
  }

  searchTerm.value = ''
  open.value = false
}
</script>

<template>
  <UInputMenu
    v-model="selected"
    v-model:search-term="searchTerm"
    v-model:open="open"
    :items="items"
    :loading="status === 'pending'"
    ignore-filter
    clear
    placeholder="Saisir le numéro du personnel"
    class="w-full"
    create-item="always"
    @create="onCreate"
  >
    <template #item-label="{ item }">
      {{ item.numPersonnel }}

      <span class="text-muted">
        {{ [item.prenom, item.nom].join(' ') }}
      </span>
    </template>

    <template #create-item-label="{ item }">
      Utiliser le numéro "{{ item }}" (nouveau personnel)
    </template>

    <template #empty>
      {{ searchTerm.length ? `Aucun personnel trouvé avec "${searchTerm}".` : 'Saisissez un numéro personnel pour commencer.' }}
    </template>
  </UInputMenu>
</template>
