import { describe, expect, it } from 'vitest'
import { formatRulesDate } from './last-updated'

describe('formatRulesDate', () => {
  it('formats as yyyy-mm-dd with zero padding', () => {
    expect(formatRulesDate(new Date('2026-03-05T12:00:00Z'))).toBe('2026-03-05')
  })

  it('uses UK time, so a late-evening BST change lands on the next day', () => {
    expect(formatRulesDate(new Date('2026-07-01T23:30:00Z'))).toBe('2026-07-02')
    expect(formatRulesDate(new Date('2026-07-01T23:30:00Z'), 'UTC')).toBe('2026-07-01')
  })

  it('matches the yyyy-mm-dd pattern', () => {
    expect(formatRulesDate(new Date())).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
