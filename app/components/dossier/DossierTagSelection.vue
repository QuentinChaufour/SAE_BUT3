<script setup lang="ts">
import TagSelection from '~/components/common/TagSelection.vue'
// TODO bug

const tags = defineModel<string[]>('tags', { required: true })
const toast = useToast()

const { idDepartement, idDossier } = defineProps<{
  idDepartement: number | null
  idDossier: number
}>()

const dossierTags = ref<string[]>(tags.value)
const optionTags = ref<string[]>([])
const disabled = ref<boolean>(false)

watch(
  () => idDepartement,
  async (newId) => {
    if (newId !== null) {
      try {
        await getDepartementTags(newId)
      } catch (error) {
        console.error(error)
        toast.add({
          color: 'error',
          title: 'Erreur',
          description: 'Impossible de récupérer les tags du département',
        })
      }
    }
  },
  { immediate: true }
)

async function getDepartementTags(idDepartement: number | null) {

  if (!idDepartement) {
    throw new Error('idDepartement is null or undefined')
  }

  const response = await $fetch<APIResponse<{ nomTag: string }[]>>(
    `/api/departement/${idDepartement}/tags`,
    { method: 'GET' },
  )

  if (response.statusCode !== 200 || !response.data) {
    throw new Error('Failed to fetch departement tags')
  }

  optionTags.value = response.data.map(tag => tag.nomTag)
}

async function deleteTag(tagToDelete: string) {

  const index = tags.value.indexOf(tagToDelete)
  if (index !== -1) {
    const response = await $fetch<APIResponse<null>>(`/api/dossier/${idDossier}/tags`, {
      method: 'DELETE',
      body: { tag: tagToDelete }
    })

    if(!response.statusCode || response.statusCode !== 200) {
      throw new Error('Failed to add tag')
    }
  }
}

async function addTag(newTag: string) {

  if (!dossierTags.value.includes(newTag)) {
    dossierTags.value.push(newTag)
  }

  // TODO manage errors
  const response = await $fetch<APIResponse<null>>(`/api/dossier/${idDossier}/tags`, {
      method: 'POST',
      body: { tag: newTag }
    })

  if(!response.statusCode || response.statusCode !== 200) {
    throw new Error('Failed to add tag')
  }
}

async function updateDossierTags(newTags: string[]) {
  dossierTags.value = newTags

  tags.value.forEach((tag) => {
    if (!dossierTags.value.includes(tag)) {
      deleteTag(tag)
      tags.value = tags.value.filter(t => t !== tag)
    }
  })

  dossierTags.value.forEach((tag) => {
    if (!tags.value.includes(tag)) {
      addTag(tag)
      tags.value.push(tag)
    }
  })
}

onMounted(async () => {
  try {
    await getDepartementTags(idDepartement)
  } catch (error) {
    console.error(error)
  }
})
// TODO loading state and error handling for the tag operations
</script>

<template>
  <TagSelection
    v-model:tags="dossierTags"
    :option-tags="optionTags"
    :disabled="disabled"
    placeholder="Ajouter un tag"
    @updated-tags="updateDossierTags"
  />
</template>
