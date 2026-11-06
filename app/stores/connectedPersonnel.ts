import { defineStore } from 'pinia'

export const useConnectedPersonnelStore = defineStore('connectedPersonnel', {
  state: () => ({
    currentYear: null as string | null,
    selectedDepartment: null as APIConnectedPersonnel | null,
    departments: [] as APIConnectedPersonnel[],
    loaded: false
  }),
  getters: {
    /**
     * Obtenir le département sélectionné. Si aucun département n'est sélectionné, retourne le premier département de la liste.
     * @param state L'état du store
     * @returns Le département sélectionné ou le premier département de la liste, ou null si aucun département n'est disponible.
     */
    getSelectedDepartment(state): APIConnectedPersonnel | null {
      if (state.selectedDepartment) return state.selectedDepartment

      const cookie = useCookie('selectedDepartment')
      if (cookie.value) {
        const department = state.departments.find(d => d.departement.id.toString() === cookie.value)
        if (department) return department

        cookie.value = null
      }

      if (state.departments.length > 0) return state.departments[0]!
      return null
    },
    /**
     * Obtenir la liste des départements de l'utilisateur connecté.
     * @param state L'état du store
     * @returns La liste des départements de l'utilisateur connecté.
     */
    getDepartments(state): APIConnectedPersonnel[] {
      return state.departments
    },
    /**
     * Obtenir l'année en cours. Si aucune année n'est sélectionnée, retourne la première année du département sélectionné.
     * @param state L'état du store
     * @returns L'année en cours ou la première année du département sélectionné, ou undefined si aucun département n'est sélectionné.
     */
    getCurrentYear(state): string | undefined {
      if (state.currentYear) return state.currentYear

      const cookie = useCookie('currentYear')
      if (cookie.value) {
        const selectedDepartment = this.getSelectedDepartment
        if (selectedDepartment && selectedDepartment.annees.includes(cookie.value)) {
          return cookie.value
        }

        cookie.value = null
      }

      const selectedDepartment = this.getSelectedDepartment
      if (selectedDepartment && selectedDepartment.annees.length > 0) {
        return selectedDepartment.annees.at(-1)!
      }
      return undefined
    },
    /**
     * Indique si l'année en cours est en lecture seule. L'année est considérée comme en lecture seule si elle n'est pas la dernière année du département sélectionné.
     * @returns true si l'année en cours est en lecture seule, false sinon.
     */
    isReadOnlyYear(): boolean {
      const selectedDepartment = this.getSelectedDepartment
      if (!selectedDepartment) return false

      const selectedYear = this.getCurrentYear
      return selectedDepartment.annees.at(-1) !== selectedYear
    }
  },
  actions: {
    /**
     * Définir le département sélectionné et mettre à jour l'année en cours en conséquence.
     * @param department Le département à sélectionner
     */
    setSelectedDepartment(department: APIConnectedPersonnel) {
      this.selectedDepartment = department
      this.currentYear = department.annees.length > 0 ? department.annees.at(-1)! : null

      const cookie = useCookie('selectedDepartment')
      cookie.value = department.departement.id.toString()
    },
    /**
     * Définir l'année en cours si elle est disponible dans le département sélectionné.
     * @param year L'année à définir comme année à afficher dans l'interface
     */
    setCurrentYear(year: string) {
      if (this.selectedDepartment && this.selectedDepartment.annees.includes(year)) {
        this.currentYear = year

        const cookie = useCookie('currentYear')
        cookie.value = year
      }
    },
    /**
     * Récupérer les départements de l'utilisateur connecté.
     */
    async fetchPromotions() {
      if (this.loaded) return

      try {
        const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
        const response = await $fetch('/api/me/personnel', { headers })
        this.departments = response
        this.loaded = true
      } catch (error) {
        console.error(error)
      }
    }
  }
})
