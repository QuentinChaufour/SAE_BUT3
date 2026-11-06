<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { getRoleRedirectPath } from '~~/shared/const/redirect'
import type UserRole from '~~/shared/types/role'

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

const paramsSchema = z.object({
  redirect: z.string().optional()
})

const session = useUserSession()

function getRedirectPath(role: UserRole) {
  const result = paramsSchema.safeParse(useRoute().query)
  if (result.success && result.data.redirect) return result.data.redirect

  return getRoleRedirectPath(role)
}

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  let response: LoginResponse

  try {
    response = await $fetch<LoginResponse>(`/api/auth/login`, {
      method: 'POST',
      body: { login: payload.data.login, password: payload.data.password }
    })

    if (!('success' in response) || !response.success) {
      throw new Error('Login failed')
    }

    await session.fetch()

    toaster.add({
      color: 'success',
      title: 'Connexion réussi !'
    })

    await navigateTo(getRedirectPath(session.user.value!.role!))
  } catch (error) {
    console.error('Error during login:', error)
    toaster.add({
      color: 'error',
      title: 'Connexion échoué !'
    })

    return
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
