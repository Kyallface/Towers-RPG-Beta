import type { CatalogueData, CatalogueEntry, CatalogueIssue, ComponentType } from './types'
import { validateCatalogue } from './validate'

export type ComponentLookup =
  | { readonly status: 'found'; readonly entry: CatalogueEntry }
  | { readonly status: 'missing'; readonly id: string }

export type Catalogue = {
  readonly data: CatalogueData
  list(type?: ComponentType): readonly CatalogueEntry[]
  get(id: string): ComponentLookup
}

export type CatalogueLoadResult =
  | { readonly status: 'ready'; readonly catalogue: Catalogue }
  | {
      readonly status: 'error'
      readonly reason: 'unavailable' | 'parse' | 'invalid'
      readonly message: string
      readonly issues: readonly CatalogueIssue[]
    }

/** Wraps already-validated data. Safe to call on both server and client. */
export function createCatalogue(data: CatalogueData): Catalogue {
  const byId = new Map(data.entries.map((entry) => [entry.id, entry]))

  return {
    data,
    list: (type) => (type ? data.entries.filter((entry) => entry.type === type) : data.entries),
    get: (id) => {
      const entry = byId.get(id)
      return entry ? { status: 'found', entry } : { status: 'missing', id }
    },
  }
}

/** Parses and validates raw catalogue JSON text. Never throws. */
export function parseCatalogue(text: string): CatalogueLoadResult {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch (error) {
    return {
      status: 'error',
      reason: 'parse',
      message: `The catalogue is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
      issues: [],
    }
  }

  const result = validateCatalogue(json)
  if (!result.ok) {
    return {
      status: 'error',
      reason: 'invalid',
      message: `The catalogue failed validation with ${result.issues.length} ${result.issues.length === 1 ? 'issue' : 'issues'}.`,
      issues: result.issues,
    }
  }

  return { status: 'ready', catalogue: createCatalogue(result.data) }
}
