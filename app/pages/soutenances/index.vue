<script setup lang="ts">

</script>

<template>
  <UDashboardPanel class="h-svh min-h-0">
    <UDashboardNavbar :title="'Soutenances'">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>
    </UDashboardNavbar>

    <div class="flex flex-1 flex-col min-h-0 m-5">
      <CalendarCreateCalendar />
    </div>

  </UDashboardPanel>
</template>
