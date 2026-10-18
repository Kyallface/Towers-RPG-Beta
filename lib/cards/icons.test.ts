import { describe, expect, it } from 'vitest'
import { getPixelIcon, ICON_GRID_SIZE, iconPath, isPixelIconId, PIXEL_ICONS } from './icons'
import { parseSavedCards, validateCardInput } from './saved'

describe('PIXEL_ICONS', () => {
  it('has unique ids and labels', () => {
    expect(new Set(PIXEL_ICONS.map((icon) => icon.id)).size).toBe(PIXEL_ICONS.length)
    expect(PIXEL_ICONS.every((icon) => icon.label.length > 0)).toBe(true)
  })

  it.each(PIXEL_ICONS.map((icon) => [icon.id, icon] as const))('%s is a valid 12x12 bitmap', (_id, icon) => {
    expect(icon.pixels).toHaveLength(ICON_GRID_SIZE)
    for (const row of icon.pixels) expect(row).toMatch(/^[#.]{12}$/)
    expect(icon.pixels.join('')).toContain('#')
  })
})

describe('icon helpers', () => {
  it('looks up icons by id', () => {
    expect(getPixelIcon('sword')?.label).toBe('Sword')
    expect(getPixelIcon('nope')).toBeUndefined()
    expect(getPixelIcon(undefined)).toBeUndefined()
    expect(isPixelIconId('flame')).toBe(true)
    expect(isPixelIconId(3)).toBe(false)
  })

  it('builds one square per filled pixel', () => {
    expect(iconPath(['#.', '.#'])).toBe('M0 0h1v1h-1zM1 1h1v1h-1z')
  })
})

describe('card icon validation', () => {
  const known = new Set(['physical'])

  it('accepts a known icon and treats empty as no icon', () => {
    const withIcon = validateCardInput('A', '', ['physical'], known, 'shield')
    expect(withIcon.ok && withIcon.icon).toBe('shield')
    const none = validateCardInput('A', '', ['physical'], known, '')
    expect(none.ok && none.icon).toBeUndefined()
    const omitted = validateCardInput('A', '', ['physical'], known)
    expect(omitted.ok && omitted.icon).toBeUndefined()
  })

  it('rejects unknown or malformed icons', () => {
    expect(validateCardInput('A', '', ['physical'], known, 'dragon').ok).toBe(false)
    expect(validateCardInput('A', '', ['physical'], known, 7).ok).toBe(false)
  })

  it('reads saved cards with and without an icon', () => {
    const text = JSON.stringify({
      schemaVersion: 1,
      cards: [
        { id: 'a', name: 'Old', componentIds: ['physical'], savedAt: '2026-01-01T00:00:00Z' },
        { id: 'b', name: 'New', icon: 'flame', componentIds: ['physical'], savedAt: '2026-01-01T00:00:00Z' },
      ],
    })
    const result = parseSavedCards(text)
    expect(result.ok && result.file.cards.map((card) => card.icon)).toEqual([undefined, 'flame'])
    expect(
      parseSavedCards(JSON.stringify({ schemaVersion: 1, cards: [{ id: 'c', name: 'X', icon: 5, componentIds: [], savedAt: 'x' }] })).ok,
    ).toBe(false)
  })
})
