import { describe, it, expect } from 'vitest'
import { numPersonnelSchema, personnelBodySchema } from '~~/shared/schemas/personnel'

describe('personnel', () => {
  describe('numPersonnelSchema', () => {
    it('should pass for valid personnel numbers', () => {
      const validNumbers = ['p987654321', 'p1', 'p123456789012']
      validNumbers.forEach((num) => {
        const result = numPersonnelSchema.safeParse(num)
        expect(result.success).toBe(true)
      })
    })

    it('should fail for invalid personnel numbers', () => {
      const invalidNumbers = ['o123456', 'o1234567890123', 'p', 'paze456', 'p-123']
      invalidNumbers.forEach((num) => {
        const result = numPersonnelSchema.safeParse(num)
        expect(result.success).toBe(false)
        expect(result.error).not.toBeNull()
        expect(result.error!.issues[0]?.message).toContain('Le numéro de personnel doit commencer par "p" suivi de 1 à 12 chiffres.')
      })
    })
  })

  describe('personnelBodySchema', () => {
    it('should pass for valid personnel body', () => {
      const validBody = {
        numPersonnel: 'p123456',
        nom: 'Doe',
        prenom: 'John',
        role: 'admin',
        department_ids: [1, 2, 3]
      }
      const result = personnelBodySchema.safeParse(validBody)
      expect(result.success).toBe(true)
    })

    it('should fail for invalid personnel body', () => {
      const invalidBody = {
        numPersonnel: 'o123456',
        nom: '',
        prenom: '',
        role: 'invalid_role'
      }
      const result = personnelBodySchema.safeParse(invalidBody)
      expect(result.success).toBe(false)
      expect(result.error).not.toBeNull()
    })
  })
})
