import UserRole from '../types/role'

/**
 * Obtenir le chemin de redirection en fonction du rôle de l'utilisateur.
 * @param role Le rôle de l'utilisateur.
 * @returns La route de redirection correspondant au rôle de l'utilisateur.
 */
export function getRoleRedirectPath(role: UserRole): string {
  switch (role) {
    case UserRole.Student:
      return '/student/search'
    case UserRole.Secretary:
    case UserRole.Teacher:
      return '/example' // TODO: A remplacer
    case UserRole.Admin:
      return '/departments'
  }
}
