import type UserRole from '~~/shared/types/role'
import type { H3Event } from 'h3'
import type { UserSessionRequired } from '#auth-utils'

/**
 * Demande à l'utilisateur de s'authentifier et vérifie si son rôle est autorisé.
 * @param event L'événement de la requête.
 * @param allowedRoles Les rôles autorisés pour accéder à la ressource. Si non fourni, tous les rôles sont autorisés.
 * @returns Une promesse avec la session de l'utilisateur si l'authentification est réussie et que le rôle est autorisé.
 */
export async function checkAuth(event: H3Event, allowedRoles?: UserRole[]): Promise<UserSessionRequired> {
  const session = await requireUserSession(event)
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden'
    })
  }

  return session
}
