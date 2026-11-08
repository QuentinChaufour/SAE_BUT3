import { defineStore } from 'pinia'

export const useConnectedStudentStore = defineStore('connectedStudent', {
  state: () => ({
    selectedPromotion: null as APIConnectedStudent | null,
    currentYear: null as string | null,
    promotions: [] as APIConnectedStudent[],
    loaded: false
  }),
  getters: {
    /**
     * Obtenir la promotion sélectionnée. Si aucune promotion n'est sélectionnée, retourne la première promotion de la liste.
     * @param state L'état du store
     * @returns La promotion sélectionnée ou la première promotion de la liste, ou null si aucune promotion n'est disponible.
     */
    getSelectedPromotion(state): APIConnectedStudent | null {
      if (state.selectedPromotion) return state.selectedPromotion

      const cookie = useCookie('selectedPromotion')
      if (cookie.value) {
        const promotion = state.promotions.find(p => p.idInscription.toString() === cookie.value)
        if (promotion) return promotion

        cookie.value = null
      }

      if (state.promotions.length > 0) return state.promotions[0]!
      return null
    },
    /**
     * Obtenir la liste des promotions de l'utilisateur connecté.
     * @param state L'état du store
     * @returns La liste des promotions de l'utilisateur connecté.
     */
    getPromotions(state): APIConnectedStudent[] {
      return state.promotions
    },
    /**
     * Indique si l'année en cours est en lecture seule.
     * @returns true si l'année en cours est en lecture seule, false sinon.
     */
    isReadOnlyYear(): boolean {
      const selectedPromotion = this.getSelectedPromotion
      if (!selectedPromotion) return false

      return selectedPromotion.readOnly
    }
  },
  actions: {
    /**
     * Définir la promotion sélectionnée.
     * @param promotion La promotion à sélectionner
     */
    setSelectedPromotion(promotion: APIConnectedStudent) {
      this.selectedPromotion = promotion

      const cookie = useCookie('selectedPromotion')
      cookie.value = promotion.idInscription.toString()
    },
    /**
     * Récupérer les promotions de l'utilisateur connecté.
     */
    async fetchPromotions() {
      if (this.loaded) return

      try {
        const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
        const response = await $fetch('/api/me/student', { headers })

        this.promotions = response
        this.loaded = true
      } catch (error) {
        console.error(error)
      }
    }
  }
})
