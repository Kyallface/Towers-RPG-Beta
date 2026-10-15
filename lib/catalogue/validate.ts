import { parseEffectText } from './effect-text'
import {
  CATALOGUE_SCHEMA_VERSION,
  COMPONENT_TYPES,
  REQUIREMENT_MAX,
  REQUIREMENT_MIN,
  REQUIREMENT_STATS_BY_TYPE,
  type CatalogueData,
  type CatalogueEntry,
  type CatalogueIssue,
  type ComponentType,
  type Requirement,
  type RequirementStat,
} from './types'

export type ValidationResult =
  | { readonly ok: true; readonly data: CatalogueData }
  | { readonly ok: false; readonly issues: readonly CatalogueIssue[] }

type JsonObject = Record<string, unknown>

const SLUG_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
const SLUG_MAX = 64

const ENVELOPE_KEYS = ['$schema', 'schemaVersion', 'entries']
const ENTRY_KEYS = [
  'id',
  'name',
  'type',
  'effect',
  'description',
  'level',
  'cost',
  'alignment',
  'requirement',
  'provisional',
]

const REQUIREMENT_PATTERN = /^([a-z])\s*(\d+)$/i

const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const describe = (value: unknown) => (value === undefined ? 'nothing' : JSON.stringify(value))

const listOf = (values: readonly unknown[]) => values.map((v) => JSON.stringify(v)).join(', ')

class Reporter {
  constructor(
    readonly issues: CatalogueIssue[] = [],
    private readonly entry: string | null = null,
  ) {}

  add(path: string, message: string) {
    this.issues.push({ path, entry: this.entry, message })
  }

  forEntry(entry: string) {
    return new Reporter(this.issues, entry)
  }
}

function checkKnownKeys(value: JsonObject, allowed: readonly string[], path: string, report: Reporter) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      report.add(`${path}.${key}`, `Unknown property "${key}". Allowed properties: ${allowed.join(', ')}.`)
    }
  }
}

function checkInteger(value: unknown, path: string, min: number, max: number, report: Reporter): value is number {
  if (value === undefined) {
    report.add(path, `Missing required integer (${min}-${max}).`)
    return false
  }
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    report.add(path, `Expected a whole number from ${min} to ${max}; got ${describe(value)}.`)
    return false
  }
  return true
}

function checkText(value: unknown, path: string, max: number, report: Reporter): value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    report.add(path, `Expected non-empty text; got ${describe(value)}.`)
    return false
  }
  if (value.length > max) {
    report.add(path, `Text is ${value.length} characters; the maximum is ${max}.`)
    return false
  }
  return true
}

function checkSlug(value: unknown, path: string, example: string, report: Reporter): value is string {
  if (typeof value !== 'string' || !SLUG_PATTERN.test(value) || value.length > SLUG_MAX) {
    report.add(
      path,
      `Expected a lowercase slug such as "${example}" (letters, digits and single hyphens, max ${SLUG_MAX} characters); got ${describe(value)}.`,
    )
    return false
  }
  return true
}

function checkOneOf<T>(value: unknown, allowed: readonly T[], path: string, report: Reporter): value is T {
  if (!allowed.includes(value as T)) {
    report.add(path, `Expected one of ${listOf(allowed)}; got ${describe(value)}.`)
    return false
  }
  return true
}

/**
 * Parses a requirement such as "P1" or "E8". The allowed stats depend on the entry type,
 * so when the type itself is invalid only the general shape is checked.
 */
function checkRequirement(value: unknown, type: unknown, path: string, report: Reporter): Requirement | null {
  const allowed = COMPONENT_TYPES.includes(type as ComponentType)
    ? REQUIREMENT_STATS_BY_TYPE[type as ComponentType]
    : null
  const example = allowed ? `${allowed[0]}1` : 'P1'
  const range = `${REQUIREMENT_MIN}-${REQUIREMENT_MAX}`

  const match = typeof value === 'string' ? REQUIREMENT_PATTERN.exec(value.trim()) : null
  if (!match) {
    report.add(path, `Expected a requirement such as "${example}" (a stat letter and a number ${range}); got ${describe(value)}.`)
    return null
  }

  const stat = match[1].toUpperCase() as RequirementStat
  const amount = Number(match[2])
  let ok = true

  if (allowed && !allowed.includes(stat)) {
    report.add(path, `A ${type} requirement must use ${allowed.join(', ')}; got "${stat}".`)
    ok = false
  }
  if (amount < REQUIREMENT_MIN || amount > REQUIREMENT_MAX) {
    report.add(path, `Requirement value must be ${range}; got ${amount}.`)
    ok = false
  }

  return ok && allowed ? { stat, value: amount } : null
}

function validateEntry(raw: unknown, index: number, parent: Reporter): CatalogueEntry | null {
  const path = `$.entries[${index}]`
  const label = isObject(raw) && typeof raw.id === 'string' && raw.id.trim() ? raw.id : `#${index}`
  const report = parent.forEntry(label)
  const issuesBefore = parent.issues.length

  if (!isObject(raw)) {
    report.add(path, `Entry must be an object; got ${describe(raw)}.`)
    return null
  }

  checkKnownKeys(raw, ENTRY_KEYS, path, report)
  checkSlug(raw.id, `${path}.id`, 'physical', report)
  checkText(raw.name, `${path}.name`, 80, report)
  checkOneOf(raw.type, COMPONENT_TYPES, `${path}.type`, report)
  const effectText = checkText(raw.effect, `${path}.effect`, 200, report)
  checkText(raw.description, `${path}.description`, 1000, report)
  checkInteger(raw.level, `${path}.level`, 0, 20, report)
  checkInteger(raw.cost, `${path}.cost`, 0, 100, report)
  checkText(raw.alignment, `${path}.alignment`, 32, report)
  const requirement = checkRequirement(raw.requirement, raw.type, `${path}.requirement`, report)

  if (raw.provisional !== undefined && typeof raw.provisional !== 'boolean') {
    report.add(`${path}.provisional`, `Expected true or false; got ${describe(raw.provisional)}.`)
  }

  const parsed = effectText ? parseEffectText(raw.effect as string) : null
  if (parsed && !parsed.ok) {
    for (const error of parsed.errors) report.add(`${path}.effect`, error)
  }

  if (parent.issues.length > issuesBefore || !parsed?.ok || !requirement) return null

  return Object.freeze({
    id: raw.id as string,
    name: raw.name as string,
    type: raw.type as ComponentType,
    effect: (raw.effect as string).trim(),
    effects: parsed.effects,
    description: raw.description as string,
    level: raw.level as number,
    cost: raw.cost as number,
    alignment: (raw.alignment as string).trim(),
    requirement: Object.freeze(requirement),
    provisional: (raw.provisional as boolean | undefined) ?? false,
  })
}

/**
 * Validates parsed JSON against catalogue schema v2 and parses each entry's effect text.
 * Returns frozen, normalised data only when every check passes.
 */
export function validateCatalogue(input: unknown): ValidationResult {
  const report = new Reporter()

  if (!isObject(input)) {
    report.add('$', `Catalogue must be an object with "schemaVersion" and "entries"; got ${describe(input)}.`)
    return { ok: false, issues: report.issues }
  }

  if (input.schemaVersion !== CATALOGUE_SCHEMA_VERSION) {
    report.add(
      '$.schemaVersion',
      `Unsupported schema version ${describe(input.schemaVersion)}. This app reads schemaVersion ${CATALOGUE_SCHEMA_VERSION}.`,
    )
    return { ok: false, issues: report.issues }
  }

  checkKnownKeys(input, ENVELOPE_KEYS, '$', report)

  if (!Array.isArray(input.entries)) {
    report.add('$.entries', `Expected a list of entries; got ${describe(input.entries)}.`)
    return { ok: false, issues: report.issues }
  }

  const entries: CatalogueEntry[] = []
  const firstIndexById = new Map<string, number>()

  input.entries.forEach((raw, index) => {
    const entry = validateEntry(raw, index, report)

    const id = isObject(raw) ? raw.id : undefined
    if (typeof id === 'string') {
      const firstIndex = firstIndexById.get(id)
      if (firstIndex === undefined) {
        firstIndexById.set(id, index)
      } else {
        report
          .forEntry(id)
          .add(
            `$.entries[${index}].id`,
            `Duplicate id "${id}" (already used by $.entries[${firstIndex}]). Catalogue ids must be unique; rename one of them.`,
          )
        return
      }
    }

    if (entry) entries.push(entry)
  })

  if (report.issues.length > 0) return { ok: false, issues: report.issues }

  return { ok: true, data: Object.freeze({ schemaVersion: CATALOGUE_SCHEMA_VERSION, entries: Object.freeze(entries) }) }
}
