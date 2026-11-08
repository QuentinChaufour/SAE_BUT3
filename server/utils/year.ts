type AcademicYear = `${number}-${number}`

/**
 * Obtenir l'année universitaire en cours.
 * Si le mois actuel est supérieur ou égal à juin, l'année universitaire est considérée comme l'année en cours - l'année suivante (ex: 2026-2027).
 * Sinon, l'année universitaire est considérée comme l'année précédente - l'année en cours (ex: 2025-2026).
 *
 * @returns L'année universitaire en cours au format "YYYY-YYYY".
 */
export function getCurrentAcademicYear(): AcademicYear {
  const currentDate = new Date()

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  if (currentMonth >= 6) return `${currentYear}-${currentYear + 1}`

  return `${currentYear - 1}-${currentYear}`
}
