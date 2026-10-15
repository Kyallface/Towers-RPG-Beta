import { describe, expect, it } from 'vitest'
import { parseSavedCards, validateCardInput } from './saved'

const known = new Set(['physical', 'long-range'])

describe('validateCardInput', () => {
  it('accepts a named card with known components, keeping duplicates', () => {
    const result = validateCardInput('  Ember Lance ', ' A burning spear. ', ['physical', 'physical', 'long-range'], known)
    expect(result).toEqual({
      ok: true,
      name: 'Ember Lance',
      description: 'A burning spear.',
      componentIds: ['physical', 'physical', 'long-range'],
    })
  })

  it('treats the description as optional', () => {
    const result = validateCardInput('A', undefined, ['physical'], known)
    expect(result).toMatchObject({ ok: true, description: '' })
  })

  it('rejects names over 30 characters and overlong descriptions', () => {
    expect(validateCardInput('x'.repeat(31), '', ['physical'], known).ok).toBe(false)
    expect(validateCardInput('A', 'x'.repeat(501), ['physical'], known).ok).toBe(false)
    expect(validateCardInput('A', 42, ['physical'], known).ok).toBe(false)
  })

  it('rejects a blank name', () => {
    expect(validateCardInput('   ', '', ['physical'], known).ok).toBe(false)
  })

  it('rejects an empty card', () => {
    expect(validateCardInput('A', '', [], known).ok).toBe(false)
  })

  it('rejects unknown component IDs', () => {
    const result = validateCardInput('A', '', ['physical', 'nope'], known)
    expect(result).toEqual({ ok: false, message: expect.stringContaining('"nope"') })
  })

  it('rejects malformed component lists', () => {
    expect(validateCardInput('A', '', 'physical', known).ok).toBe(false)
    expect(validateCardInput('A', '', [1], known).ok).toBe(false)
  })
})

describe('parseSavedCards', () => {
  it('parses a valid file', () => {
    const text = JSON.stringify({
      schemaVersion: 1,
      cards: [{ id: 'a', name: 'A', componentIds: ['physical'], savedAt: '2026-10-14T00:00:00.000Z' }],
    })
    const result = parseSavedCards(text)
    expect(result.ok && result.file.cards).toHaveLength(1)
  })

  it('rejects invalid JSON, wrong versions and malformed cards', () => {
    expect(parseSavedCards('{').ok).toBe(false)
    expect(parseSavedCards(JSON.stringify({ schemaVersion: 2, cards: [] })).ok).toBe(false)
    expect(parseSavedCards(JSON.stringify({ schemaVersion: 1, cards: [{ id: 'a' }] })).ok).toBe(false)
  })
})
