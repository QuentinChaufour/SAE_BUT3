import { describe, it, expect } from 'vitest'
import { yearSchema } from '~~/shared/schemas/year'

describe('year', () => {
  it('check valid year', async () => {
    const result = yearSchema.safeParse('2026-2027')

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('check invalid form', async () => {
    const result = yearSchema.safeParse('2026')

    expect(result.success).toBe(false)
    expect(result.error).not.toBeNull()

    expect(result.error!.issues).toHaveLength(2)
    expect(result.error!.issues[0]?.message).toContain('L\'année doit être au format "YYYY-YYYY".')
    expect(result.error!.issues[1]?.message).toContain('L\'année doit être consécutive, par exemple "2026-2027".')
  })

  it('check consecutive year', async () => {
    const result = yearSchema.safeParse('2026-2028')

    expect(result.success).toBe(false)
    expect(result.error).not.toBeNull()

    expect(result.error!.issues).toHaveLength(1)
    expect(result.error!.issues[0]?.message).toContain('L\'année doit être consécutive, par exemple "2026-2027".')
  })

  it('check empty year', async () => {
    const result = yearSchema.safeParse('')

    expect(result.success).toBe(false)
    expect(result.error).not.toBeNull()

    expect(result.error!.issues).toHaveLength(2)
    expect(result.error!.issues[0]?.message).toContain('L\'année doit être au format "YYYY-YYYY".')
  })
})
