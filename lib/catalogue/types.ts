export const CATALOGUE_SCHEMA_VERSION = 2

export const COMPONENT_TYPES = ['Form', 'Modifier'] as const
export type ComponentType = (typeof COMPONENT_TYPES)[number]

export const DICE_SIDES = [4, 6, 8, 10, 12, 20] as const
export type DieSides = (typeof DICE_SIDES)[number]

export const RANGE_UNITS = ['ft'] as const
export type RangeUnit = (typeof RANGE_UNITS)[number]

export const EFFECT_KINDS = ['dice', 'range'] as const

/**
 * Every alignment pairs a Form stat (Phy, Int, Emo) with a Mod stat (Pow, Fin).
 * Forms use the first column and Modifiers the second; this is also the display order.
 */
export const FORM_STATS = ['Phy', 'Int', 'Emo'] as const
export const MOD_STATS = ['Pow', 'Fin'] as const
export const STATS = [...FORM_STATS, ...MOD_STATS] as const
export type Stat = (typeof STATS)[number]
export type RequirementStat = Stat

export const STAT_LABELS: Readonly<Record<Stat, string>> = {
  Phy: 'Physical',
  Int: 'Intellectual',
  Emo: 'Emotional',
  Pow: 'Power',
  Fin: 'Finesse',
}

/** Display order for requirement stats on a resolved card. */
export const REQUIREMENT_STATS: readonly Stat[] = STATS

export const STATS_BY_TYPE: Readonly<Record<ComponentType, readonly Stat[]>> = {
  Form: FORM_STATS,
  Modifier: MOD_STATS,
}
export const REQUIREMENT_STATS_BY_TYPE = STATS_BY_TYPE

/** Older catalogues used single letters; "P" means Phy on a Form but Pow on a Modifier. */
export const LEGACY_STAT_LETTERS: Readonly<Record<ComponentType, Readonly<Record<string, Stat>>>> = {
  Form: { P: 'Phy', I: 'Int', E: 'Emo' },
  Modifier: { P: 'Pow', F: 'Fin' },
}

export const REQUIREMENT_MIN = 1
export const REQUIREMENT_MAX = 10

/** Requirement ("REQ"), written in the catalogue as e.g. "Phy1" or "Fin2". */
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
  /** Phy, Int or Emo for Forms; Pow or Fin for Modifiers. */
  readonly alignment: Stat
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
