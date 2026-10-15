import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { createCatalogue, parseCatalogue } from '../catalogue/catalogue'
import { formatEffect } from '../catalogue/format'
import type { CatalogueData, CatalogueEntry } from '../catalogue/types'
import { removeOccurrence } from './draft'
import { resolveCard, type CardResolution } from './resolve'

const catalogueText = readFileSync(path.join(__dirname, '../../content/catalogue.json'), 'utf8')
const parsed = parseCatalogue(catalogueText)
if (parsed.status !== 'ready') throw new Error(parsed.message)
const catalogue = parsed.catalogue

const STACK = ['physical', 'physical', 'range', 'range']

function resolved(result: CardResolution) {
  if (result.status !== 'resolved') throw new Error(`expected resolved, got ${result.status}`)
  return result
}

function entry(overrides: Partial<CatalogueEntry> & Pick<CatalogueEntry, 'id' | 'effects'>): CatalogueEntry {
  return {
    name: overrides.id,
    type: 'Form',
    level: 1,
    cost: 1,
    provisional: true,
    description: 'Test entry.',
    effect: 'test',
    alignment: 'PP',
    requirement: { stat: 'P', value: 1 },
    ...overrides,
  }
}

describe('resolveCard requirements (#28)', () => {
  it('lists each requirement stat used by the card', () => {
    const result = resolved(resolveCard(STACK, catalogue))
    expect(result.requirements).toEqual([
      { stat: 'P', value: 1 },
      { stat: 'F', value: 1 },
    ])
  })

  it('keeps the highest value per stat and orders stats P, I, E, F', () => {
    const custom = createCatalogue({
      schemaVersion: 2,
      entries: [
        entry({ id: 'a', effects: [], requirement: { stat: 'F', value: 2 }, type: 'Modifier' }),
        entry({ id: 'b', effects: [], requirement: { stat: 'E', value: 8 } }),
        entry({ id: 'c', effects: [], requirement: { stat: 'P', value: 3 } }),
        entry({ id: 'd', effects: [], requirement: { stat: 'P', value: 5 }, type: 'Modifier' }),
      ],
    } as CatalogueData)
    const result = resolved(resolveCard(['a', 'b', 'c', 'd'], custom))
    expect(result.requirements).toEqual([
      { stat: 'P', value: 5 },
      { stat: 'E', value: 8 },
      { stat: 'F', value: 2 },
    ])
  })
})

describe('resolveCard (#12)', () => {
  it('returns an empty result for an empty card', () => {
    expect(resolveCard([], catalogue)).toEqual({ status: 'empty' })
  })

  it('resolves a single component', () => {
    const result = resolved(resolveCard(['physical'], catalogue))
    expect(result.effects.map(formatEffect)).toEqual(['1d6 physical'])
    expect(result.totalCost).toBe(1)
  })

  it('resolves [physical, physical, range, range] to 2d6 physical and 20 ft range', () => {
    const result = resolved(resolveCard(STACK, catalogue))
    expect(result.effects.map(formatEffect)).toEqual(['2d6 physical', '20 ft range'])
    expect(result.totalCost).toBe(4)
    expect(result.occurrences).toBe(4)
    expect(result.components.map((c) => [c.entry.id, c.quantity])).toEqual([
      ['physical', 2],
      ['range', 2],
    ])
  })

  it('reflects one-occurrence removal', () => {
    const update = removeOccurrence({ componentIds: STACK }, 0, 'physical')
    if (!update.ok) throw new Error(update.message)
    const result = resolved(resolveCard(update.draft.componentIds, catalogue))
    expect(result.effects.map(formatEffect)).toEqual(['1d6 physical', '20 ft range'])
    expect(result.totalCost).toBe(3)
  })

  it('does not mutate its inputs', () => {
    const ids = [...STACK]
    const snapshot = JSON.stringify(catalogue.data)
    resolveCard(ids, catalogue)
    expect(ids).toEqual(STACK)
    expect(JSON.stringify(catalogue.data)).toBe(snapshot)
  })

  it('uses current catalogue values without rewriting card IDs', () => {
    const changed: CatalogueData = {
      schemaVersion: 2,
      entries: catalogue.data.entries.map((e) =>
        e.id === 'range'
          ? { ...e, cost: 3, effects: [{ kind: 'range', value: 30, unit: 'ft' }] }
          : e,
      ),
    }
    const ids = [...STACK]
    const result = resolved(resolveCard(ids, createCatalogue(changed)))
    expect(result.effects.map(formatEffect)).toEqual(['2d6 physical', '60 ft range'])
    expect(result.totalCost).toBe(8)
    expect(ids).toEqual(STACK)
  })

  it('reports unknown IDs and never returns partial totals', () => {
    const result = resolveCard(['physical', 'fireball', 'range'], catalogue)
    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({ position: 2, id: 'fireball' })
      expect(result.errors[0].message).toMatch(/not in the catalogue/)
    }
  })

  it('reports unsupported dice combinations', () => {
    const mixed = createCatalogue({
      schemaVersion: 2,
      entries: [
        entry({ id: 'd6', effects: [{ kind: 'dice', count: 1, sides: 6, damageType: 'physical' }] }),
        entry({ id: 'd8', effects: [{ kind: 'dice', count: 1, sides: 8, damageType: 'physical' }] }),
      ],
    })
    const result = resolveCard(['d6', 'd8'], mixed)
    expect(result.status).toBe('error')
    if (result.status === 'error') expect(result.errors[0].message).toMatch(/cannot combine 1d8 physical with 1d6 physical/)
  })

  it('keeps different damage types and effect kinds separate', () => {
    const multi = createCatalogue({
      schemaVersion: 2,
      entries: [
        entry({ id: 'physical', effects: [{ kind: 'dice', count: 1, sides: 6, damageType: 'physical' }] }),
        entry({ id: 'fire', effects: [{ kind: 'dice', count: 1, sides: 8, damageType: 'fire' }] }),
      ],
    })
    const result = resolved(resolveCard(['physical', 'fire', 'physical'], multi))
    expect(result.effects.map(formatEffect)).toEqual(['2d6 physical', '1d8 fire'])
  })
})
