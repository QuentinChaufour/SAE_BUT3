/**
 * Middleware assurant que l'utilisateur est authentifiée lors de l'accès a une page intégrant celui-ci
 * Redirige l'utilisateur vers la page de connexion s'il n'est pas authentifié
 */
export default defineNuxtRouteMiddleware(async () => {
  const session = useUserSession()

  if (!session.loggedIn.value) {
    return navigateTo('/auth/login')
  }
})
