import UserRole from '~~/shared/types/role'
import { useConnectedPersonnelStore } from '~/stores/connectedPersonnel'
import { useConnectedStudentStore } from '~/stores/connectedStudent'

/**
 * Middleware assurant que l'utilisateur est authentifiée lors de l'accès a une page intégrant celui-ci
 * Redirige l'utilisateur vers la page de connexion s'il n'est pas authentifié
 */
export default defineNuxtRouteMiddleware(async (_to, from) => {
  const session = useUserSession()
  await session.fetch()

  if (!session.loggedIn.value) {
    const userWantedPath = from.fullPath === '/' ? undefined : from.fullPath
    return navigateTo({
      path: '/auth/login',
      query: { redirect: userWantedPath }
    })
  }

  switch (session.user.value?.role) {
    case UserRole.Student: {
      const store = useConnectedStudentStore()
      await store.fetchPromotions()
      break
    }
    case UserRole.Secretary:
    case UserRole.Teacher: {
      const store = useConnectedPersonnelStore()
      await store.fetchPromotions()
      break
    }
  }
})
