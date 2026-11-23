import type UserRole from '~~/shared/types/role'

export default defineNuxtRouteMiddleware((to, _from) => {
  const session = useUserSession()

  const role: UserRole[] | UserRole | undefined = to.meta.role

  // don't check for role access is no roles are specified for the targeted page
  if (!role) {
    return
  }

  const hasRole = Array.isArray(role) ? role.includes(session.user.value?.role) : role == session.user.value?.role

  if (!hasRole) {
    throw abortNavigation(createError({
      status: 403,
      statusText: 'Forbbiden',
      fatal: true
    }))
  }
})
