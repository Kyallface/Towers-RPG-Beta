import {
  CATALOGUE_SCHEMA_VERSION,
  COMPONENT_TYPES,
  DICE_SIDES,
  EFFECT_KINDS,
  RANGE_UNITS,
  type CatalogueData,
  type CatalogueEntry,
  type CatalogueIssue,
  type ComponentType,
  type DieSides,
  type Effect,
  type RangeUnit,
} from './types'

export type ValidationResult =
  | { readonly ok: true; readonly data: CatalogueData }
  | { readonly ok: false; readonly issues: readonly CatalogueIssue[] }

type JsonObject = Record<string, unknown>

const SLUG_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
const SLUG_MAX = 64

const ENVELOPE_KEYS = ['$schema', 'schemaVersion', 'entries']
const ENTRY_KEYS = ['id', 'name', 'type', 'level', 'pointCost', 'provisional', 'effects', 'description']
const DICE_KEYS = ['kind', 'count', 'sides', 'damageType']
const RANGE_KEYS = ['kind', 'value', 'unit']

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

function validateEffect(raw: unknown, path: string, report: Reporter): Effect | null {
  if (!isObject(raw)) {
    report.add(path, `Effect must be an object with a "kind"; got ${describe(raw)}.`)
    return null
  }

  if (raw.kind === 'dice') {
    checkKnownKeys(raw, DICE_KEYS, path, report)
    const count = checkInteger(raw.count, `${path}.count`, 1, 20, report)
    const sides = checkOneOf(raw.sides, DICE_SIDES, `${path}.sides`, report)
    const damageType = checkSlug(raw.damageType, `${path}.damageType`, 'physical', report)
    if (!count || !sides || !damageType) return null
    return Object.freeze({
      kind: 'dice',
      count: raw.count as number,
      sides: raw.sides as DieSides,
      damageType: raw.damageType as string,
    })
  }

  if (raw.kind === 'range') {
    checkKnownKeys(raw, RANGE_KEYS, path, report)
    const value = checkInteger(raw.value, `${path}.value`, 1, 1000, report)
    const unit = checkOneOf(raw.unit, RANGE_UNITS, `${path}.unit`, report)
    if (!value || !unit) return null
    return Object.freeze({ kind: 'range', value: raw.value as number, unit: raw.unit as RangeUnit })
  }

  report.add(`${path}.kind`, `Unsupported effect kind ${describe(raw.kind)}. Supported kinds: ${EFFECT_KINDS.join(', ')}.`)
  return null
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
  checkInteger(raw.level, `${path}.level`, 0, 20, report)
  checkInteger(raw.pointCost, `${path}.pointCost`, 0, 100, report)
  checkText(raw.description, `${path}.description`, 1000, report)

  if (raw.provisional !== undefined && typeof raw.provisional !== 'boolean') {
    report.add(`${path}.provisional`, `Expected true or false; got ${describe(raw.provisional)}.`)
  }

  const effects: Effect[] = []
  if (!Array.isArray(raw.effects) || raw.effects.length === 0) {
    report.add(`${path}.effects`, 'Expected a list with at least one effect.')
  } else {
    raw.effects.forEach((effect, i) => {
      const parsed = validateEffect(effect, `${path}.effects[${i}]`, report)
      if (parsed) effects.push(parsed)
    })
  }

  if (parent.issues.length > issuesBefore) return null

  return Object.freeze({
    id: raw.id as string,
    name: raw.name as string,
    type: raw.type as ComponentType,
    level: raw.level as number,
    pointCost: raw.pointCost as number,
    provisional: (raw.provisional as boolean | undefined) ?? false,
    effects: Object.freeze(effects),
    description: raw.description as string,
  })
}

/**
 * Validates parsed JSON against catalogue schema v1 and its effect semantics.
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
