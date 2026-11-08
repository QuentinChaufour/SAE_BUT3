import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  dateToString,
  getCurrentDateString,
  stringToDate
} from '~~/shared/utils/date'

describe('date utilities', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats the current UTC date as DD/MM/YYYY', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-06T12:00:00.000Z'))

    expect(getCurrentDateString()).toBe('06/01/2026')
  })

  it('formats a double-digit current UTC date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-15T12:00:00.000Z'))

    expect(getCurrentDateString()).toBe('15/11/2026')
  })

  it('formats a date as DD/MM/YYYY', () => {
    expect(dateToString(new Date('2026-11-06T12:00:00.000Z'))).toBe(
      '06/11/2026'
    )
  })

  it('formats a double-digit date as DD/MM/YYYY', () => {
    expect(dateToString(new Date('2026-03-15T12:00:00.000Z'))).toBe(
      '15/03/2026'
    )
  })

  it('converts a DD/MM/YYYY string to a Date', () => {
    expect(stringToDate('15/03/2026')).toEqual(new Date(2026, 2, 14))
  })

  it.each([
    '',
    '15/03',
    'invalid'
  ])('rejects invalid date string "%s"', (dateString) => {
    expect(() => stringToDate(dateString)).toThrow(
      'Invalid date string format. Expected format: "DD/MM/YYYY"'
    )
  })
})