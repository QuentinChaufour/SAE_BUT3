<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

/**
 * Login.vue
 * 
 * Page where the user enter his credential to get authenticated
 */

definePageMeta({
  layout: 'empty'
})

type LoginResponse = { success: true } | { error: false, message: string }

const fields = ref<AuthFormField[]>([
  {
    name: 'login',
    type: 'text',
    label: 'Nom d\'utilisateur',
    placeholder: 'oXXXXXXX / pXXXXXXX',
    required: true
  },
  {
    name: 'password',
    type: 'password',
    label: 'Mot de passe',
    placeholder: 'Votre mot de passe',
    required: true
  }
])

// Define the schema
const schema = z.object({
  login: z.string().min(1, 'Champs Obligatoire'),
  password: z.string().min(8, 'Minimum 8 caractères')
})

const toaster = useToast()
const loading = ref<boolean>(false)

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  let response: LoginResponse

  try {
    response = await $fetch<LoginResponse>(`/api/auth/login`, {
      method: 'POST',
      body: { login: payload.data.login, password: payload.data.password }
    })

    if ('success' in response && response.success) {
      toaster.add({
        color: 'success',
        title: 'Connexion réussi !'
      })

      // TODO redirect the user to a main page based on his role
      navigateTo('/example')
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
  <div class="flex min-h-screen justify-center items-center">
    <UAuthForm
      title="Connexion"
      description="Veuillez vous connecter pour accéder à votre compte."
      icon="i-lucide-user"
      :fields="fields"
      :schema="schema"
      :submit="{
        label: 'Connexion',
        variant: 'subtle'
      }"
      :loading="loading"
      class="w-full max-w-md p-5"
      @submit="onSubmit"
    />
  </div>
</template>
