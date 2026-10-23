import { describe, it, expect } from 'vitest'
import { yearSchema } from '~~/shared/schemas/year'

describe('year', () => {
  it('check valid year', async () => {
    const result = yearSchema.safeParse('2026-2027')

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('check empty year', async () => {
    const result = yearSchema.safeParse('')

    expect(result.success).toBe(false)
    expect(result.error).not.toBeNull()

    expect(result.error!.issues).toHaveLength(1)
    expect(result.error!.issues[0]?.message).toContain('L\'année est requise.')
  })
})
