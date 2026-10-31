import { describe, it, expect } from 'vitest'
import { studentSearchFields } from '~~/shared/schemas/student-search.js'

describe('student-search', () => {
  it('check missing entreprise id', async () => {
    const result = studentSearchFields.safeParse({ titre: 'Title', alternance: false })

    expect(result.success).toBe(false)
    expect(result.error).not.toBeNull()

    expect(result.error!.issues).toHaveLength(1)
    expect(result.error!.issues[0]?.message).toContain('L\'entreprise est requise.')
  })

  it('check title too short', async () => {
    const result = studentSearchFields.safeParse({ titre: 'a', alternance: false, idEntreprise: 1 })

    expect(result.success).toBe(false)
    expect(result.error).not.toBeNull()

    expect(result.error!.issues).toHaveLength(1)
    expect(result.error!.issues[0]?.message).toContain('Le titre doit faire au moins 5 caractères.')
  })

  it('check title too long', async () => {
    const result = studentSearchFields.safeParse({ titre: 'a'.repeat(10000), alternance: false, idEntreprise: 1 })

    expect(result.success).toBe(false)
    expect(result.error).not.toBeNull()

    expect(result.error!.issues).toHaveLength(1)
    expect(result.error!.issues[0]?.message).toContain('Le titre ne peut pas dépasser 100 caractères.')
  })

  it('check description too long', async () => {
    const result = studentSearchFields.safeParse({ titre: 'titre', description: 'z'.repeat(10000), alternance: false, idEntreprise: 1 })

    expect(result.success).toBe(false)
    expect(result.error).not.toBeNull()

    expect(result.error!.issues).toHaveLength(1)
    expect(result.error!.issues[0]?.message).toContain('La description ne peut pas dépasser 2000 caractères.')
  })

  it('check valid input', async () => {
    const result = studentSearchFields.safeParse({
      titre: 'titre',
      description: 'description',
      alternance: false,
      idEntreprise: 1
    })

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })
})
