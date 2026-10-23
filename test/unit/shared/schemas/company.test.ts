import { describe, it, expect } from 'vitest'
import { companyFields } from '~~/shared/schemas/company.js'

describe('company', () => {
  it('check postal code required in France', async () => {
    const result = companyFields.safeParse({
      nom: 'Entreprise',
      adresse: '1 rue de la Paix',
      ville: 'Paris',
      pays: 'France'
    })

    expect(result.success).toBe(false)
    expect(result.error).not.toBeNull()

    expect(result.error!.issues).toHaveLength(1)
    expect(result.error!.issues[0]?.message).toContain('Le code postal est obligatoire en France.')
  })

  it('test invalid postal code format in France', async () => {
    const result = companyFields.safeParse({
      nom: 'Entreprise',
      adresse: '1 rue de la Paix',
      ville: 'Paris',
      pays: 'France',
      codePostal: '7500'
    })

    expect(result.success).toBe(false)
    expect(result.error).not.toBeNull()

    expect(result.error!.issues).toHaveLength(1)
    expect(result.error!.issues[0]?.message).toContain('Le code postal doit contenir exactement 5 chiffres pour la France.')
  })

  it('test valid postal code format in France', async () => {
    const result = companyFields.safeParse({
      nom: 'Entreprise',
      adresse: '1 rue de la Paix',
      ville: 'Paris',
      pays: 'France',
      codePostal: '75000'
    })

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('test foreign country - no postal code required', async () => {
    const result = companyFields.safeParse({
      nom: 'SEntreprise',
      adresse: '1 rue de la Paix',
      ville: 'Zurich',
      pays: 'Suisse'
    })

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })
})
