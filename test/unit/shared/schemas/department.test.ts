import { describe, it, expect } from 'vitest'
import { nomDepartementSchema } from '~~/shared/schemas/department.js'

describe('department', () => {
  it('check valid name', async () => {
    const result = nomDepartementSchema.safeParse('Informatique')

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('check too short name', async () => {
    const result = nomDepartementSchema.safeParse('In')

    expect(result.success).toBe(false)
    expect(result.error).not.toBeNull()

    expect(result.error!.issues).toHaveLength(1)
    expect(result.error!.issues[0]?.message).toContain('Le nom du département doit contenir au moins 3 caractères.')
  })

  it('check too long name', async () => {
    const result = nomDepartementSchema.safeParse('i'.repeat(101))

    expect(result.success).toBe(false)
    expect(result.error).not.toBeNull()

    expect(result.error!.issues).toHaveLength(1)
    expect(result.error!.issues[0]?.message).toContain('Le nom du département ne peut pas dépasser 100 caractères.')
  })
})
