import type UserRole from '~~/shared/types/role'

export default defineNuxtRouteMiddleware((to, _from) => {
  const session = useUserSession()

  const role: UserRole[] | UserRole | undefined = to.meta.role

  // don't check for role access is no roles are specified for the targeted page
  if (!role) {
    return
  }

  const sessionRole = session.user.value?.role
  const hasRole = sessionRole
    ? Array.isArray(role) ? role.includes(sessionRole) : role === sessionRole
    : false

  if (!hasRole) {
    throw abortNavigation(createError({
      status: 403,
      statusText: 'Forbbiden',
      fatal: true
    }))
  }
})
