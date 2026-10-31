import { z } from 'zod'

export const yearSchema = z.string().regex(/^\d{4}-\d{4}$/, 'L\'année doit être au format "YYYY-YYYY".').refine(
  (year) => {
    const [startYear, endYear] = year.split('-').map(Number)
    return endYear === startYear! + 1
  },
  { message: 'L\'année doit être consécutive, par exemple "2026-2027".' }
)
