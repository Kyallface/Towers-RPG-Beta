export const CATALOGUE_SCHEMA_VERSION = 1

export const COMPONENT_TYPES = ['Form', 'Modifier'] as const
export type ComponentType = (typeof COMPONENT_TYPES)[number]

export const DICE_SIDES = [4, 6, 8, 10, 12, 20] as const
export type DieSides = (typeof DICE_SIDES)[number]

export const RANGE_UNITS = ['ft'] as const
export type RangeUnit = (typeof RANGE_UNITS)[number]

export const EFFECT_KINDS = ['dice', 'range'] as const

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
  readonly level: number
  readonly pointCost: number
  readonly provisional: boolean
  readonly effects: readonly Effect[]
  readonly description: string
}

export type CatalogueData = {
  readonly schemaVersion: typeof CATALOGUE_SCHEMA_VERSION
  readonly entries: readonly CatalogueEntry[]
}

export type CatalogueIssue = {
  /** JSON path to the offending value, e.g. `$.entries[1].effects[0].sides`. */
  readonly path: string
  /** Entry id when known, otherwise `#<index>`; null for envelope-level issues. */
  readonly entry: string | null
  readonly message: string
}
