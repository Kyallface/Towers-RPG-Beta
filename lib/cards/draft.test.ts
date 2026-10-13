import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseCatalogue } from '../catalogue/catalogue'
import { addComponent, EMPTY_DRAFT, groupQuantities, removeOccurrence, removeOneOf, type CardDraft } from './draft'

const catalogueText = readFileSync(path.join(__dirname, '../../catalogue/catalogue.json'), 'utf8')
const result = parseCatalogue(catalogueText)
if (result.status !== 'ready') throw new Error(result.message)
const catalogue = result.catalogue

const STACK: CardDraft = { componentIds: ['physical', 'physical', 'range', 'range'] }

function add(draft: CardDraft, id: string, type: 'Form' | 'Modifier') {
  const update = addComponent(draft, catalogue, id, type)
  if (!update.ok) throw new Error(update.message)
  return update.draft
}

describe('adding Forms (#8)', () => {
  it('starts empty and appends the Form ID only', () => {
    expect(EMPTY_DRAFT.componentIds).toEqual([])
    expect(add(EMPTY_DRAFT, 'physical', 'Form')).toEqual({ componentIds: ['physical'] })
  })

  it('rejects a Modifier from the Form picker without changing the draft', () => {
    const update = addComponent(EMPTY_DRAFT, catalogue, 'range', 'Form')
    expect(update.ok).toBe(false)
    expect(update.draft).toBe(EMPTY_DRAFT)
    if (!update.ok) expect(update.message).toMatch(/Range is a Modifier/)
  })

  it('rejects unknown IDs with an actionable message', () => {
    const update = addComponent(EMPTY_DRAFT, catalogue, 'fireball', 'Form')
    expect(update.ok).toBe(false)
    if (!update.ok) expect(update.message).toMatch(/not in the catalogue/)
  })
})

describe('adding Modifiers (#9)', () => {
  it('appends Range to the same list, preserving existing order', () => {
    const draft = add(add(EMPTY_DRAFT, 'physical', 'Form'), 'range', 'Modifier')
    expect(draft.componentIds).toEqual(['physical', 'range'])
  })

  it('does not mutate the previous draft', () => {
    const before = { componentIds: ['physical'] }
    add(before, 'range', 'Modifier')
    expect(before.componentIds).toEqual(['physical'])
  })
})

describe('stacks (#10)', () => {
  it('keeps duplicate Forms and Modifiers without deduplication', () => {
    let draft = EMPTY_DRAFT
    draft = add(draft, 'physical', 'Form')
    draft = add(draft, 'physical', 'Form')
    draft = add(draft, 'range', 'Modifier')
    draft = add(draft, 'range', 'Modifier')
    expect(draft).toEqual(STACK)
    expect(Array.isArray(draft.componentIds)).toBe(true)
  })

  it('derives quantities that account for every occurrence', () => {
    const quantities = groupQuantities(STACK.componentIds)
    expect(quantities).toEqual([
      { id: 'physical', quantity: 2 },
      { id: 'range', quantity: 2 },
    ])
    const rebuilt = quantities.flatMap(({ id, quantity }) => Array(quantity).fill(id))
    expect(rebuilt).toEqual(STACK.componentIds)
  })
})

describe('removing components (#11)', () => {
  it('removes one occurrence, leaving the rest in order', () => {
    const update = removeOccurrence(STACK, 0, 'physical')
    expect(update.ok && update.draft.componentIds).toEqual(['physical', 'range', 'range'])
  })

  it('grouped decrement removes exactly one occurrence', () => {
    const update = removeOneOf(STACK, 'physical')
    expect(update.ok && update.draft.componentIds).toEqual(['physical', 'range', 'range'])
  })

  it('removing the last component returns an empty draft', () => {
    const update = removeOccurrence({ componentIds: ['range'] }, 0, 'range')
    expect(update.ok && update.draft.componentIds).toEqual([])
  })

  it('ignores stale or invalid targets', () => {
    expect(removeOccurrence(STACK, 0, 'range')).toMatchObject({ ok: false, draft: STACK })
    expect(removeOccurrence(STACK, 9, 'range')).toMatchObject({ ok: false, draft: STACK })
    expect(removeOccurrence(STACK, 1.5, 'physical')).toMatchObject({ ok: false, draft: STACK })
    expect(removeOneOf(STACK, 'fireball')).toMatchObject({ ok: false, draft: STACK })
  })
})
