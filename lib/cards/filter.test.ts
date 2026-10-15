import { describe, expect, it } from 'vitest'
import type { CatalogueEntry } from '@/lib/catalogue/types'
import { EMPTY_FILTERS, filterEntries, hasActiveFilters } from './filter'

function entry(overrides: Partial<CatalogueEntry>): CatalogueEntry {
  return {
    id: 'x',
    name: 'X',
    type: 'Form',
    effect: '1d6 physical',
    effects: [{ kind: 'dice', count: 1, sides: 6, damageType: 'physical' }],
    description: 'd',
    level: 1,
    cost: 1,
    alignment: 'Phy',
    requirement: { stat: 'Phy', value: 1 },
    provisional: false,
    ...overrides,
  }
}

const entries = [
  entry({ id: 'physical', name: 'Physical', alignment: 'Phy', level: 1, cost: 1 }),
  entry({ id: 'mind-spike', name: 'Mind Spike', alignment: 'Int', level: 2, cost: 3 }),
  entry({ id: 'swift-strike', name: 'Swift Strike', alignment: 'Fin', type: 'Modifier', level: 1, cost: 2 }),
]

const ids = (list: CatalogueEntry[]) => list.map((e) => e.id)

describe('filterEntries', () => {
  it('returns everything with no filters', () => {
    expect(filterEntries(entries, EMPTY_FILTERS)).toHaveLength(3)
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false)
  })

  it('filters by alignment code, not description', () => {
    expect(ids(filterEntries(entries, { ...EMPTY_FILTERS, alignment: 'int' }))).toEqual(['mind-spike'])
    expect(filterEntries(entries, { ...EMPTY_FILTERS, alignment: 'Intellectual' })).toHaveLength(0)
  })

  it('searches name case-insensitively by substring', () => {
    expect(ids(filterEntries(entries, { ...EMPTY_FILTERS, name: 'strike' }))).toEqual(['swift-strike'])
  })

  it('matches level and cost exactly', () => {
    expect(ids(filterEntries(entries, { ...EMPTY_FILTERS, level: '1' }))).toEqual(['physical', 'swift-strike'])
    expect(ids(filterEntries(entries, { ...EMPTY_FILTERS, cost: '3' }))).toEqual(['mind-spike'])
    expect(filterEntries(entries, { ...EMPTY_FILTERS, cost: 'abc' })).toHaveLength(0)
  })

  describe('requirement filters', () => {
    const mixed = [
      entry({ id: 'f-p1', type: 'Form', requirement: { stat: 'Phy', value: 1 } }),
      entry({ id: 'f-e3', type: 'Form', requirement: { stat: 'Emo', value: 3 } }),
      entry({ id: 'm-p1', type: 'Modifier', requirement: { stat: 'Pow', value: 1 } }),
      entry({ id: 'm-f2', type: 'Modifier', requirement: { stat: 'Fin', value: 2 } }),
    ]

    it('Form REQ filters only Forms', () => {
      expect(ids(filterEntries(mixed, { ...EMPTY_FILTERS, formReqStat: 'Emo', formReqValue: '3' }))).toEqual([
        'f-e3',
        'm-p1',
        'm-f2',
      ])
    })

    it('Mod REQ filters only Modifiers', () => {
      expect(ids(filterEntries(mixed, { ...EMPTY_FILTERS, modReqStat: 'Fin' }))).toEqual(['f-p1', 'f-e3', 'm-f2'])
    })

    it('matches on number alone', () => {
      expect(ids(filterEntries(mixed, { ...EMPTY_FILTERS, formReqValue: '1', modReqValue: '2' }))).toEqual([
        'f-p1',
        'm-f2',
      ])
    })

    it('counts as an active filter and clears with EMPTY_FILTERS', () => {
      expect(hasActiveFilters({ ...EMPTY_FILTERS, modReqStat: 'Pow' })).toBe(true)
      expect(filterEntries(mixed, EMPTY_FILTERS)).toHaveLength(4)
    })
  })

  it('combines filters', () => {
    const filters = { ...EMPTY_FILTERS, level: '1', alignment: 'Fin' }
    expect(ids(filterEntries(entries, filters))).toEqual(['swift-strike'])
    expect(hasActiveFilters(filters)).toBe(true)
  })
})
