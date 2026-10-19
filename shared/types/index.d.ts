import type UserRole from './role'

declare module '#app' {

  /**
   * Interface enrichissant l'utilisateur de auth-utils
   *
   * Un utilisateur est identifié possède un numéro identifiant,
   * un role définissant ses actions au sein de
   * l'application, ainsi que son nom/prénom
   */
  interface PageMeta {
    role?: UserRole | UserRole[]
  }
}

export {}
