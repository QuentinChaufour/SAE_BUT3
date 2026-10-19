<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const colorMode = useColorMode()

const username = ref('Prénom Nom')

const items = computed<DropdownMenuItem[][]>(() => ([
  [{
    type: 'label',
    label: username.value,
    avatar: {
      alt: username.value
    }
  }],
  [
    {
      label: 'Mot de passe',
      icon: 'i-lucide-lock',
      to: '/account/password'
    },
    {
      label: 'Apparence',
      icon: 'i-lucide-sun-moon',
      children: [{
        label: 'Clair',
        icon: 'i-lucide-sun',
        type: 'checkbox',
        checked: colorMode.value === 'light',
        onSelect(e: Event) {
          e.preventDefault()

          colorMode.preference = 'light'
        }
      }, {
        label: 'Sombre',
        icon: 'i-lucide-moon',
        type: 'checkbox',
        checked: colorMode.value === 'dark',
        onUpdateChecked(checked: boolean) {
          if (checked) {
            colorMode.preference = 'dark'
          }
        },
        onSelect(e: Event) {
          e.preventDefault()
        }
      }]
    }],
  [{
    label: 'Déconnexion',
    icon: 'i-lucide-log-out'
  }]]))
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        avatar: { alt: username, size: 'sm' },
        label: collapsed ? undefined : username,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
    />
  </UDropdownMenu>
</template>
