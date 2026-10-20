declare module '#auth-utils' {

  /**
   * Interface enrichissant l'utilisateur de auth-utils
   *
   * Un utilisateur est identifié possède un numéro identifiant,
   * un role définissant ses actions au sein de
   * l'application, ainsi que son nom/prénom
   */
  interface User {
    numId: string
    role: UserRoles
    nom: string
    prenom: string
  }
}

export {}
