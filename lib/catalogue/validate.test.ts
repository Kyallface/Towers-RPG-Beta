import { describe, expect, it } from 'vitest'
import catalogue from '../../catalogue/catalogue.json'
import validExample from '../../catalogue/examples/valid.json'
import duplicateIdExample from '../../catalogue/examples/invalid-duplicate-id.json'
import invalidEffectExample from '../../catalogue/examples/invalid-effect.json'
import invalidVersionExample from '../../catalogue/examples/invalid-version.json'
import { validateCatalogue } from './validate'

const physical = () => ({
  id: 'physical',
  name: 'Physical',
  type: 'Form',
  level: 1,
  pointCost: 1,
  effects: [{ kind: 'dice', count: 1, sides: 6, damageType: 'physical' }],
  description: 'A strike.',
})

const withEntry = (entry: unknown) => ({ schemaVersion: 1, entries: [entry] })

function issuesFor(input: unknown) {
  const result = validateCatalogue(input)
  if (result.ok) throw new Error('Expected validation to fail')
  return result.issues
}

describe('validateCatalogue: valid fixtures', () => {
  it('accepts the committed test catalogue', () => {
    const result = validateCatalogue(catalogue)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.entries.map((e) => e.id)).toEqual(['physical', 'range'])
    expect(result.data.entries.every((e) => e.provisional)).toBe(true)
  })

  it('accepts the documented valid example and defaults provisional to false', () => {
    const result = validateCatalogue(validExample)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.entries[0].provisional).toBe(false)
  })

  it('accepts an empty catalogue', () => {
    expect(validateCatalogue({ schemaVersion: 1, entries: [] }).ok).toBe(true)
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

  it('reports invalid dice sides and range units with entry ids', () => {
    const issues = issuesFor(invalidEffectExample)
    expect(issues.map((i) => [i.entry, i.path])).toEqual([
      ['physical', '$.entries[0].effects[0].sides'],
      ['range', '$.entries[1].effects[0].unit'],
    ])
  })

  it('rejects unsupported schema versions', () => {
    const issues = issuesFor(invalidVersionExample)
    expect(issues[0].path).toBe('$.schemaVersion')
    expect(issues[0].message).toMatch(/Unsupported schema version 2/)
  })
})

describe('validateCatalogue: focused failures', () => {
  it('rejects non-object input', () => {
    expect(issuesFor(null)[0].path).toBe('$')
    expect(issuesFor([])[0].path).toBe('$')
  })

  it('rejects a missing entries list', () => {
    expect(issuesFor({ schemaVersion: 1 })[0].path).toBe('$.entries')
  })

  it.each(['id', 'name', 'type', 'level', 'pointCost', 'effects', 'description'])(
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
    expect(issuesFor(withEntry({ ...physical(), pointCost: 1.5 }))[0].path).toBe('$.entries[0].pointCost')
    expect(issuesFor(withEntry({ ...physical(), pointCost: '1' }))[0].path).toBe('$.entries[0].pointCost')
  })

  it('rejects an empty effects list', () => {
    expect(issuesFor(withEntry({ ...physical(), effects: [] }))[0].path).toBe('$.entries[0].effects')
  })

  it('rejects unsupported effect kinds', () => {
    const [issue] = issuesFor(withEntry({ ...physical(), effects: [{ kind: 'healing', amount: 4 }] }))
    expect(issue.path).toBe('$.entries[0].effects[0].kind')
    expect(issue.message).toMatch(/Supported kinds: dice, range/)
  })

  it('rejects invalid dice payloads', () => {
    const issues = issuesFor(
      withEntry({ ...physical(), effects: [{ kind: 'dice', count: 0, sides: 6, damageType: 'Physical' }] }),
    )
    expect(issues.map((i) => i.path)).toEqual(['$.entries[0].effects[0].count', '$.entries[0].effects[0].damageType'])
  })

  it('rejects unknown properties to catch typos', () => {
    const [issue] = issuesFor(withEntry({ ...physical(), pointcost: 1 }))
    expect(issue.path).toBe('$.entries[0].pointcost')
  })

  it('rejects a non-boolean provisional flag', () => {
    expect(issuesFor(withEntry({ ...physical(), provisional: 'yes' }))[0].path).toBe('$.entries[0].provisional')
  })

  it('collects every issue rather than stopping at the first', () => {
    const issues = issuesFor({
      schemaVersion: 1,
      entries: [{ ...physical(), level: 99 }, { ...physical(), id: 'other', type: 'Spell', pointCost: -1 }],
    })
    expect(issues).toHaveLength(3)
  })
})
