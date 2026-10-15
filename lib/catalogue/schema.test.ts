import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const contentDir = path.join(__dirname, '../../content')
const schema = JSON.parse(readFileSync(path.join(contentDir, 'catalogue.schema.json'), 'utf8'))
const catalogue = JSON.parse(readFileSync(path.join(contentDir, 'catalogue.json'), 'utf8'))

type Entry = { id: string; type: string; requirement: string }

const entrySchema = Object.values(schema.$defs ?? schema.definitions ?? {}).find(
  (def): def is { allOf: { if: { properties: { type: { const: string } } }; then: { properties: { requirement: { pattern: string } } } }[]; properties: { requirement: { pattern: string } } } =>
    typeof def === 'object' && def !== null && 'allOf' in def,
)

function requirementPatternFor(type: string): RegExp {
  const rule = entrySchema?.allOf.find((r) => r.if.properties.type.const === type)
  if (!rule) throw new Error(`No requirement rule for ${type} in catalogue.schema.json`)
  return new RegExp(rule.then.properties.requirement.pattern)
}

const entries: Entry[] = catalogue.entries

describe('content/catalogue.json against catalogue.schema.json', () => {
  it('finds the entry definition with type-specific rules', () => {
    expect(entrySchema).toBeDefined()
  })

  it.each(entries.map((entry) => [entry.id, entry] as const))('%s satisfies the base requirement pattern', (_id, entry) => {
    expect(entry.requirement).toMatch(new RegExp(entrySchema!.properties.requirement.pattern))
  })

  it.each(entries.map((entry) => [entry.id, entry] as const))('%s satisfies its type-specific requirement pattern', (_id, entry) => {
    expect(entry.requirement).toMatch(requirementPatternFor(entry.type))
  })

  it('type-specific patterns accept the canonical labels and reject the old single letters', () => {
    expect('Phy1').toMatch(requirementPatternFor('Form'))
    expect('Emo10').toMatch(requirementPatternFor('Form'))
    expect('Pow3').not.toMatch(requirementPatternFor('Form'))
    expect('P1').not.toMatch(requirementPatternFor('Form'))
    expect('Fin1').toMatch(requirementPatternFor('Modifier'))
    expect('Phy1').not.toMatch(requirementPatternFor('Modifier'))
    expect('F1').not.toMatch(requirementPatternFor('Modifier'))
  })
})
