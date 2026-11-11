/**
 * Obtenir le nom d'affichage d'une ville en fonction de la ville, du code postal et du pays.
 * @param city Le nom de la ville.
 * @param postalCode Le code postal de la ville (peut être null).
 * @param country Le nom du pays.
 * @returns Le nom d'affichage formaté de la ville.
 */
export function getCityDisplayName(city: string, postalCode: string | null, country: string | null): string {
  if (postalCode) {
    return `${postalCode} ${city}${country && country !== 'France' ? `, ${country}` : ''}`
  } else if (country && country !== 'France') {
    return `${city}, ${country}`
  }

  return city || 'N/A'
}
