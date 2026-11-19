/**
 * Obtenir la date au format français (jj/mm/aaaa) à partir d'une date
 * @param date La date à formater
 * @returns La date au format français (jj/mm/aaaa)
 */
export function formatDateToFRFormat(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
