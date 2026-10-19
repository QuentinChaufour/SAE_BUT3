<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)
type UserRole = 'student' | 'secretariat' | 'teacher'

const role = useState<UserRole>('current-user-role', () => 'student')

const roleLabels: Record<UserRole, string> = {
  student: 'Étudiant',
  secretariat: 'Secrétariat',
  teacher: 'Enseignant'
}

const navigationByRole: Record<UserRole, NavigationMenuItem[][]> = {
  student: [[{
    label: 'Tableau de bord',
    icon: 'i-lucide-layout-dashboard',
    to: '/'
  }, {
    label: 'Mes stages',
    icon: 'i-lucide-briefcase-business',
    to: '/stages'
  }, {
    label: 'Mes candidatures',
    icon: 'i-lucide-send',
    to: '/candidatures',
    badge: '2'
  }, {
    label: 'Documents',
    icon: 'i-lucide-folder-open',
    to: '/documents'
  }], [{
    label: 'Aide',
    icon: 'i-lucide-circle-help',
    to: '/aide'
  }]],
  secretariat: [[{
    label: 'Vue d’ensemble',
    icon: 'i-lucide-layout-dashboard',
    to: '/'
  }, {
    label: 'Étudiants',
    icon: 'i-lucide-users',
    to: '/etudiants'
  }, {
    label: 'Conventions',
    icon: 'i-lucide-file-check-2',
    to: '/conventions',
    badge: '8'
  }, {
    label: 'Entreprises',
    icon: 'i-lucide-building-2',
    to: '/entreprises'
  }], [{
    label: 'Paramètres',
    icon: 'i-lucide-settings-2',
    to: '/parametres'
  }]],
  teacher: [[{
    label: 'Tableau de bord',
    icon: 'i-lucide-layout-dashboard',
    to: '/'
  }, {
    label: 'Suivi des stages',
    icon: 'i-lucide-clipboard-check',
    to: '/suivi-stages'
  }, {
    label: 'Étudiants',
    icon: 'i-lucide-users',
    to: '/etudiants'
  }, {
    label: 'Évaluations',
    icon: 'i-lucide-notebook-pen',
    to: '/evaluations'
  }], [{
    label: 'Aide',
    icon: 'i-lucide-circle-help',
    to: '/aide'
  }]]
}

const links = computed(() => navigationByRole[role.value].map(group => group.map(item => ({
  ...item,
  onSelect: () => {
    open.value = false
  }
}))))
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="group/sidebar bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header>
        <AppLogo />
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer>
        <div class="flex w-full items-center gap-3 px-1 group-data-[collapsed=true]/sidebar:justify-center">
          <UAvatar
            src="https://i.pravatar.cc/80?img=12"
            alt="Marie Dupont"
            size="sm"
          />
          <div class="min-w-0 group-data-[collapsed=true]/sidebar:hidden">
            <p class="truncate text-sm font-medium text-highlighted">
              Marie Dupont
            </p>
            <p class="truncate text-xs text-muted">
              {{ roleLabels[role] }}
            </p>
          </div>
          <UButton
            icon="i-lucide-more-horizontal"
            color="neutral"
            variant="ghost"
            size="xs"
            class="ml-auto"
            aria-label="Ouvrir le menu du profil"
            :class="'group-data-[collapsed=true]/sidebar:hidden'"
          />
        </div>
      </template>
    </UDashboardSidebar>

    <UDashboardPanel>
      <slot />
    </UDashboardPanel>
  </UDashboardGroup>
</template>
