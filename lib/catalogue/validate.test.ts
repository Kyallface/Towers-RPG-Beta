import { describe, expect, it } from 'vitest'
import catalogue from '../../content/catalogue.json'
import { parseEffectText } from './effect-text'
import duplicateIdExample from './fixtures/invalid-duplicate-id.json'
import invalidEffectExample from './fixtures/invalid-effect.json'
import invalidVersionExample from './fixtures/invalid-version.json'
import validExample from './fixtures/valid.json'
import { validateCatalogue } from './validate'

const physical = () => ({
  id: 'physical',
  name: 'Physical',
  type: 'Form',
  effect: '1d6 physical',
  description: 'A strike.',
  level: 1,
  cost: 1,
  alignment: 'PP',
})

const withEntry = (entry: unknown) => ({ schemaVersion: 2, entries: [entry] })

function issuesFor(input: unknown) {
  const result = validateCatalogue(input)
  if (result.ok) throw new Error('Expected validation to fail')
  return result.issues
}

describe('validateCatalogue: valid fixtures', () => {
  it('accepts the committed content catalogue with every required field', () => {
    const result = validateCatalogue(catalogue)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.entries.map((e) => e.id)).toEqual(['physical', 'range'])
    expect(result.data.entries[0]).toMatchObject({
      type: 'Form',
      effect: '1d6 physical',
      level: 1,
      cost: 1,
      alignment: 'PP',
      effects: [{ kind: 'dice', count: 1, sides: 6, damageType: 'physical' }],
    })
    expect(result.data.entries.every((e) => e.provisional)).toBe(true)
  })

  it('accepts the documented valid example, parses multiple effects and defaults provisional to false', () => {
    const result = validateCatalogue(validExample)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.entries[0].provisional).toBe(false)
    expect(result.data.entries[0].effects).toEqual([
      { kind: 'dice', count: 2, sides: 8, damageType: 'fire' },
      { kind: 'range', value: 30, unit: 'ft' },
    ])
  })

  it('accepts an empty catalogue', () => {
    expect(validateCatalogue({ schemaVersion: 2, entries: [] }).ok).toBe(true)
  })

  it('returns frozen data so resolvers cannot mutate it', () => {
    const result = validateCatalogue(catalogue)
    if (!result.ok) throw new Error('expected ok')
    expect(Object.isFrozen(result.data.entries)).toBe(true)
    expect(Object.isFrozen(result.data.entries[0].effects[0])).toBe(true)
  })
})

describe('validateCatalogue: documented invalid examples', () => {
  it('reports duplicate catalogue ids on the second occurrence', () => {
    const issues = issuesFor(duplicateIdExample)
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ path: '$.entries[1].id', entry: 'physical' })
    expect(issues[0].message).toMatch(/Duplicate id "physical".*\$\.entries\[0\]/)
  })

  it('reports invalid dice sides and range units against the effect field', () => {
    const issues = issuesFor(invalidEffectExample)
    expect(issues.map((i) => [i.entry, i.path])).toEqual([
      ['physical', '$.entries[0].effect'],
      ['range', '$.entries[1].effect'],
    ])
    expect(issues[0].message).toMatch(/d7 is not a supported die/)
    expect(issues[1].message).toMatch(/range must be in ft/)
  })

  it('rejects unsupported schema versions', () => {
    const issues = issuesFor(invalidVersionExample)
    expect(issues[0].path).toBe('$.schemaVersion')
    expect(issues[0].message).toMatch(/Unsupported schema version 1/)
  })
})

describe('validateCatalogue: focused failures', () => {
  it('rejects non-object input', () => {
    expect(issuesFor(null)[0].path).toBe('$')
    expect(issuesFor([])[0].path).toBe('$')
  })

  it('rejects a missing entries list', () => {
    expect(issuesFor({ schemaVersion: 2 })[0].path).toBe('$.entries')
  })

  it.each(['id', 'name', 'type', 'effect', 'description', 'level', 'cost', 'alignment'])(
    'reports a missing %s field',
    (field) => {
      const entry: Record<string, unknown> = physical()
      delete entry[field]
      const issues = issuesFor(withEntry(entry))
      expect(issues.map((i) => i.path)).toContain(`$.entries[0].${field}`)
    },
  )

  it('labels issues by index when the id itself is missing', () => {
    const { id: _id, ...entry } = physical()
    expect(issuesFor(withEntry(entry))[0].entry).toBe('#0')
  })

  it('rejects ids that are empty or not slugs', () => {
    expect(issuesFor(withEntry({ ...physical(), id: '' }))[0].path).toBe('$.entries[0].id')
    expect(issuesFor(withEntry({ ...physical(), id: 'Physical Strike' }))[0].path).toBe('$.entries[0].id')
  })

  it('treats type as case-sensitive', () => {
    const [issue] = issuesFor(withEntry({ ...physical(), type: 'form' }))
    expect(issue.path).toBe('$.entries[0].type')
    expect(issue.message).toContain('"Form", "Modifier"')
  })

  it('enforces numeric bounds and integers', () => {
    expect(issuesFor(withEntry({ ...physical(), level: 21 }))[0].path).toBe('$.entries[0].level')
    expect(issuesFor(withEntry({ ...physical(), level: -1 }))[0].path).toBe('$.entries[0].level')
    expect(issuesFor(withEntry({ ...physical(), cost: 1.5 }))[0].path).toBe('$.entries[0].cost')
    expect(issuesFor(withEntry({ ...physical(), cost: '1' }))[0].path).toBe('$.entries[0].cost')
  })

  it('rejects an empty alignment', () => {
    expect(issuesFor(withEntry({ ...physical(), alignment: ' ' }))[0].path).toBe('$.entries[0].alignment')
  })

  it('rejects unrecognised effect text with guidance', () => {
    const [issue] = issuesFor(withEntry({ ...physical(), effect: 'heals 4' }))
    expect(issue.path).toBe('$.entries[0].effect')
    expect(issue.message).toMatch(/"1d6 physical" or "10 ft range"/)
  })

  it('rejects unknown properties to catch typos', () => {
    const [issue] = issuesFor(withEntry({ ...physical(), pointCost: 1 }))
    expect(issue.path).toBe('$.entries[0].pointCost')
  })

  it('rejects a non-boolean provisional flag', () => {
    expect(issuesFor(withEntry({ ...physical(), provisional: 'yes' }))[0].path).toBe('$.entries[0].provisional')
  })

  it('collects every issue rather than stopping at the first', () => {
    const issues = issuesFor({
      schemaVersion: 2,
      entries: [{ ...physical(), level: 99 }, { ...physical(), id: 'other', type: 'Spell', cost: -1 }],
    })
    expect(issues).toHaveLength(3)
  })
})

describe('parseEffectText', () => {
  it('normalises case and whitespace', () => {
    expect(parseEffectText('  2D6   Physical ,  20 FT range ')).toEqual({
      ok: true,
      effects: [
        { kind: 'dice', count: 2, sides: 6, damageType: 'physical' },
        { kind: 'range', value: 20, unit: 'ft' },
      ],
    })
  })

  it('reports every bad part', () => {
    const result = parseEffectText('0d6 physical, 2000 ft range')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors).toHaveLength(2)
  })

  it('rejects empty text', () => {
    expect(parseEffectText(' , ').ok).toBe(false)
  })
})
