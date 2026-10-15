export const CATALOGUE_SCHEMA_VERSION = 2

export const COMPONENT_TYPES = ['Form', 'Modifier'] as const
export type ComponentType = (typeof COMPONENT_TYPES)[number]

export const DICE_SIDES = [4, 6, 8, 10, 12, 20] as const
export type DieSides = (typeof DICE_SIDES)[number]

export const RANGE_UNITS = ['ft'] as const
export type RangeUnit = (typeof RANGE_UNITS)[number]

export const EFFECT_KINDS = ['dice', 'range'] as const

/** Display order for requirement stats on a resolved card. */
export const REQUIREMENT_STATS = ['P', 'I', 'E', 'F'] as const
export type RequirementStat = (typeof REQUIREMENT_STATS)[number]

export const REQUIREMENT_STATS_BY_TYPE: Readonly<Record<ComponentType, readonly RequirementStat[]>> = {
  Form: ['P', 'I', 'E'],
  Modifier: ['P', 'F'],
}

export const REQUIREMENT_MIN = 1
export const REQUIREMENT_MAX = 10

/** Requirement ("REQ"), written in the catalogue as e.g. "P1" or "E8". */
export type Requirement = {
  readonly stat: RequirementStat
  readonly value: number
}

export type DiceEffect = {
  readonly kind: 'dice'
  readonly count: number
  readonly sides: DieSides
  readonly damageType: string
}

export type RangeEffect = {
  readonly kind: 'range'
  readonly value: number
  readonly unit: RangeUnit
}

export type Effect = DiceEffect | RangeEffect

export type CatalogueEntry = {
  readonly id: string
  readonly name: string
  readonly type: ComponentType
  /** The effect text exactly as written in the catalogue, e.g. "1d6 physical". */
  readonly effect: string
  /** Structured effects parsed from `effect`; the resolver only ever reads these. */
  readonly effects: readonly Effect[]
  readonly description: string
  readonly level: number
  readonly cost: number
  readonly alignment: string
  readonly requirement: Requirement
  readonly provisional: boolean
}

export type CatalogueData = {
  readonly schemaVersion: typeof CATALOGUE_SCHEMA_VERSION
  readonly entries: readonly CatalogueEntry[]
}

export type CatalogueIssue = {
  /** JSON path to the offending value, e.g. `$.entries[1].effect`. */
  readonly path: string
  /** Entry id when known, otherwise `#<index>`; null for envelope-level issues. */
  readonly entry: string | null
  readonly message: string
}
