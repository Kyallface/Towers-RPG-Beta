import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseCatalogue } from './catalogue'
import { formatEffect } from './format'

const catalogueText = readFileSync(path.join(__dirname, '../../content/catalogue.json'), 'utf8')

function readyCatalogue() {
  const result = parseCatalogue(catalogueText)
  if (result.status !== 'ready') throw new Error(result.message)
  return result.catalogue
}

describe('parseCatalogue', () => {
  it('loads the repository catalogue', () => {
    expect(readyCatalogue().list()).toHaveLength(2)
  })

  it('reports malformed JSON without throwing', () => {
    const result = parseCatalogue('{ "schemaVersion": 1, ')
    expect(result).toMatchObject({ status: 'error', reason: 'parse' })
  })

  it('reports validation failures with issues', () => {
    const result = parseCatalogue(JSON.stringify({ schemaVersion: 2, entries: [{ id: 'x' }] }))
    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.reason).toBe('invalid')
      expect(result.issues.length).toBeGreaterThan(0)
    }
  })
})

describe('Catalogue access', () => {
  it('lists components by type', () => {
    const catalogue = readyCatalogue()
    expect(catalogue.list('Form').map((e) => e.id)).toEqual(['physical'])
    expect(catalogue.list('Modifier').map((e) => e.id)).toEqual(['range'])
  })

  it('looks up components by id, including repeated lookups of the same id', () => {
    const catalogue = readyCatalogue()
    const first = catalogue.get('physical')
    const second = catalogue.get('physical')
    expect(first.status).toBe('found')
    expect(second).toEqual(first)
  })

  it('returns an explicit missing result for unknown ids', () => {
    expect(readyCatalogue().get('fireball')).toEqual({ status: 'missing', id: 'fireball' })
  })
})

describe('formatEffect', () => {
  it('formats fixture effects from data alone', () => {
    const catalogue = readyCatalogue()
    const effectsOf = (id: string) => {
      const lookup = catalogue.get(id)
      if (lookup.status !== 'found') throw new Error(`missing ${id}`)
      return lookup.entry.effects.map(formatEffect)
    }
    expect(effectsOf('physical')).toEqual(['1d6 physical'])
    expect(effectsOf('range')).toEqual(['10 ft range'])
  })
})
