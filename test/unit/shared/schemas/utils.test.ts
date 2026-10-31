import { describe, it, expect } from 'vitest'
import z from 'zod'
import { emptyToNull } from '~~/shared/schemas/utils'

describe('utils', () => {
  it('check empty string no error', async () => {
    const originalSchema = z.string().min(1)

    const originalResult = originalSchema.safeParse('')
    expect(originalResult.success).toBe(false)
    expect(originalResult.error).not.toBeNull()

    expect(originalResult.error!.issues).toHaveLength(1)
    expect(originalResult.error!.issues[0]?.message).toContain('Too small: expected string to have >=1 characters')

    const schema = emptyToNull(originalSchema)

    const result = schema.safeParse('')
    expect(result.success).toBe(true)
    expect(result.data).toBeNull()
  })
})
