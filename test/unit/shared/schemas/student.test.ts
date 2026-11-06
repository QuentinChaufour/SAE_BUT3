import { describe, it, expect } from 'vitest'
import { studentIdSchema } from '~~/shared/schemas/student.js'

describe('student', () => {
  it('check valid student id', async () => {
    const result = studentIdSchema.safeParse('o12345678')

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('check invalid student id', async () => {
    const result = studentIdSchema.safeParse('12345678901234567890345678')

    expect(result.success).toBe(false)
    expect(result.error).not.toBeNull()

    expect(result.error!.issues).toHaveLength(1)
    expect(result.error!.issues[0]?.message).toContain('Le numéro étudiant ne peut pas dépasser 10 caractères.')
  })

  it('check empty student id', async () => {
    const result = studentIdSchema.safeParse('')

    expect(result.success).toBe(false)
    expect(result.error).not.toBeNull()

    expect(result.error!.issues).toHaveLength(1)
    expect(result.error!.issues[0]?.message).toContain('Le numéro étudiant est requis.')
  })
})
