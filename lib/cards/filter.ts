import type { CatalogueEntry } from '@/lib/catalogue/types'

export const ALIGNMENTS = [
  { code: 'PP', label: 'Power Physical' },
  { code: 'PI', label: 'Power Intellectual' },
  { code: 'PE', label: 'Power Emotional' },
  { code: 'FP', label: 'Finesse Physical' },
  { code: 'FI', label: 'Finesse Intellectual' },
  { code: 'FE', label: 'Finesse Emotional' },
] as const

export type ComponentFilters = {
  readonly alignment: string
  readonly name: string
  readonly level: string
  readonly cost: string
}

export const EMPTY_FILTERS: ComponentFilters = { alignment: '', name: '', level: '', cost: '' }

export function hasActiveFilters(filters: ComponentFilters): boolean {
  return Object.values(filters).some((value) => value.trim() !== '')
}

function matchesNumber(value: number, query: string): boolean {
  const trimmed = query.trim()
  if (trimmed === '') return true
  const wanted = Number(trimmed)
  return Number.isFinite(wanted) && value === wanted
}

export function matchesFilters(entry: CatalogueEntry, filters: ComponentFilters): boolean {
  const alignment = filters.alignment.trim().toUpperCase()
  if (alignment !== '' && entry.alignment.toUpperCase() !== alignment) return false

  const name = filters.name.trim().toLowerCase()
  if (name !== '' && !entry.name.toLowerCase().includes(name)) return false

  return matchesNumber(entry.level, filters.level) && matchesNumber(entry.cost, filters.cost)
}

export function filterEntries(entries: readonly CatalogueEntry[], filters: ComponentFilters): CatalogueEntry[] {
  return entries.filter((entry) => matchesFilters(entry, filters))
}
