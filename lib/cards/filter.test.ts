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
    alignment: 'PP',
    requirement: { stat: 'P', value: 1 },
    provisional: false,
    ...overrides,
  }
}

const entries = [
  entry({ id: 'physical', name: 'Physical', alignment: 'PP', level: 1, cost: 1 }),
  entry({ id: 'mind-spike', name: 'Mind Spike', alignment: 'PI', level: 2, cost: 3 }),
  entry({ id: 'swift-strike', name: 'Swift Strike', alignment: 'FP', level: 1, cost: 2 }),
]

const ids = (list: CatalogueEntry[]) => list.map((e) => e.id)

describe('filterEntries', () => {
  it('returns everything with no filters', () => {
    expect(filterEntries(entries, EMPTY_FILTERS)).toHaveLength(3)
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false)
  })

  it('filters by alignment code, not description', () => {
    expect(ids(filterEntries(entries, { ...EMPTY_FILTERS, alignment: 'PI' }))).toEqual(['mind-spike'])
    expect(filterEntries(entries, { ...EMPTY_FILTERS, alignment: 'Power Intellectual' })).toHaveLength(0)
  })

  it('searches name case-insensitively by substring', () => {
    expect(ids(filterEntries(entries, { ...EMPTY_FILTERS, name: 'strike' }))).toEqual(['swift-strike'])
  })

  it('matches level and cost exactly', () => {
    expect(ids(filterEntries(entries, { ...EMPTY_FILTERS, level: '1' }))).toEqual(['physical', 'swift-strike'])
    expect(ids(filterEntries(entries, { ...EMPTY_FILTERS, cost: '3' }))).toEqual(['mind-spike'])
    expect(filterEntries(entries, { ...EMPTY_FILTERS, cost: 'abc' })).toHaveLength(0)
  })

  it('combines filters', () => {
    const filters = { ...EMPTY_FILTERS, level: '1', alignment: 'FP' }
    expect(ids(filterEntries(entries, filters))).toEqual(['swift-strike'])
    expect(hasActiveFilters(filters)).toBe(true)
  })
})
