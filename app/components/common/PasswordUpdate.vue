<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

/**
 * Component allowing a authentificated user
 * to update his password
 *
 * @emits passwordUpdated when the password has been successfully updated
 */

const emits = defineEmits<{
  passwordUpdated: []
}>()

type LoginResponse = { success: true } | { error: false, message: string }
const session = useUserSession()

const fields = ref<AuthFormField[]>([
  {
    name: 'login',
    type: 'text',
    label: 'Nom d\'utilisateur',
    placeholder: 'oXXXXXXX / pXXXXXXX',
    defaultValue: session.user.value?.numId,
    required: true
  },
  {
    name: 'oldPassword',
    type: 'password',
    label: 'Ancien Mot de passe',
    placeholder: 'Votre ancien mot de passe',
    required: true
  },
  {
    name: 'newPassword',
    type: 'password',
    label: 'Nouveau Mot de passe',
    placeholder: 'Votre nouveau mot de passe',
    required: true
  }
])

// Define the schema
const schema = z
  .object({
    login: z.string().min(1, 'Champs Obligatoire'),
    oldPassword: z.string().min(8, 'Minimum 8 caractères'),
    newPassword: z.string().min(8, 'Minimum 8 caractères')
  })
  .refine(obj => obj.oldPassword !== obj.newPassword, {
    path: ['newPassword'],
    message: 'Le nouveau et l\'ancien mot de passe doivent être différent.'
  })

const toaster = useToast()
const loading = ref<boolean>(false)

type Schema = z.output<typeof schema>

/**
 * Submit the form content to the API
 *
 * @param { FormSubmitEvent } payload the data from the form
 */
async function onSubmit(payload: FormSubmitEvent<Schema>) {
  let response: LoginResponse

  try {
    response = await $fetch<LoginResponse>(`/api/auth/password`, {
      method: 'POST',
      body: {
        login: payload.data.login,
        oldPassword: payload.data.oldPassword,
        newPassword: payload.data.newPassword
      }
    })

    if ('success' in response && response.success) {
      toaster.add({
        color: 'success',
        title: 'Connexion réussi !'
      })

      // the password has successfully been updated
      emits('passwordUpdated')
    }
  } catch {
    toaster.add({
      color: 'error',
      title: 'Connexion échoué !'
    })
  }
}
</script>

<template>
  <div class="flex justify-center items-center">
    <UAuthForm
      title="Changement de mot de passe"
      description="Veuillez indiquer vos identifiant ainsi que votre nouveau mot de passe."
      icon="i-lucide-user"
      :fields="fields"
      :schema="schema"
      :submit="{
        label: 'Modifier',
        variant: 'subtle'
      }"
      :loading="loading"
      class="w-full max-w-md p-5"
      @submit="onSubmit"
    />
  </div>
</template>
