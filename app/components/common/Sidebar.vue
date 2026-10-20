<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import UserMenu from './UserMenu.vue'
import UserRole from '~~/shared/types/role.js'

const open = ref(true)

const role = useState<UserRole>('current-user-role', () => UserRole.Secretary)

function getLinksByRole(role: UserRole): NavigationMenuItem[] {
  switch (role) {
    case UserRole.Student:
      return [{
        label: 'Recherche de stages',
        icon: 'i-lucide-search',
        to: '/student/search/'
      }]
    case UserRole.Secretary:
      return [
        ...getLinksByRole(UserRole.Teacher),
        {
          label: 'Enseignants',
          icon: 'i-lucide-users',
          to: '/teachers/'
        }
      ]
    case UserRole.Teacher:
      return [
        {
          label: 'Tableau de bord',
          icon: 'i-lucide-layout-dashboard',
          to: '/'
        }, {
          label: 'Étudiants',
          icon: 'i-lucide-users',
          to: '/students/'
        },
        {
          label: 'Soutenances',
          icon: 'i-lucide-calendar',
          to: '/soutenances/'
        }
      ]
    case UserRole.Admin:
      return [{
        label: 'Secrétariats',
        icon: 'i-lucide-users',
        to: '/secretariats/'
      }]
    default:
      return []
  }
}

const sublinks: NavigationMenuItem[] = [{
  label: 'Crédits',
  icon: 'i-lucide-info'
}]
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header>
        <UIcon
          name="i-logos-nuxt-icon"
          class="size-8"
        />
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="getLinksByRole(role)"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="sublinks"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
