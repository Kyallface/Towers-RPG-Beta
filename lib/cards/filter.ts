import { STAT_LABELS, STATS, type CatalogueEntry, type Requirement } from '@/lib/catalogue/types'

export const ALIGNMENTS = STATS.map((code) => ({ code, label: STAT_LABELS[code] }))

export type ComponentFilters = {
  readonly alignment: string
  readonly name: string
  readonly level: string
  readonly cost: string
  readonly formReqStat: string
  readonly formReqValue: string
  readonly modReqStat: string
  readonly modReqValue: string
}

export const EMPTY_FILTERS: ComponentFilters = {
  alignment: '',
  name: '',
  level: '',
  cost: '',
  formReqStat: '',
  formReqValue: '',
  modReqStat: '',
  modReqValue: '',
}

function matchesRequirement(requirement: Requirement, stat: string, value: string): boolean {
  const wantedStat = stat.trim().toUpperCase()
  if (wantedStat !== '' && requirement.stat.toUpperCase() !== wantedStat) return false
  return matchesNumber(requirement.value, value)
}

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

  if (!matchesNumber(entry.level, filters.level) || !matchesNumber(entry.cost, filters.cost)) return false

  return entry.type === 'Form'
    ? matchesRequirement(entry.requirement, filters.formReqStat, filters.formReqValue)
    : matchesRequirement(entry.requirement, filters.modReqStat, filters.modReqValue)
}

export function filterEntries(entries: readonly CatalogueEntry[], filters: ComponentFilters): CatalogueEntry[] {
  return entries.filter((entry) => matchesFilters(entry, filters))
}
