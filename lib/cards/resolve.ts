import type { Catalogue } from '../catalogue/catalogue'
import type { CatalogueEntry, DieSides, Effect } from '../catalogue/types'

export type ResolvedComponent = {
  readonly entry: CatalogueEntry
  readonly quantity: number
}

export type ResolutionError = {
  /** 1-based position in the card's component list. */
  readonly position: number
  readonly id: string
  readonly message: string
}

export type CardResolution =
  | { readonly status: 'empty' }
  | {
      readonly status: 'resolved'
      readonly components: readonly ResolvedComponent[]
      readonly effects: readonly Effect[]
      readonly totalPointCost: number
      readonly occurrences: number
    }
  | { readonly status: 'error'; readonly errors: readonly ResolutionError[] }

type DiceTotal = { count: number; sides: DieSides; damageType: string }

/**
 * Pure: resolves every occurrence (including duplicates) against the current catalogue,
 * following the stacking contract in catalogue/README.md. Inputs are never mutated and
 * the output is derived data, never a source of truth. Any error invalidates the whole
 * card so partial totals are never presented as valid.
 */
export function resolveCard(componentIds: readonly string[], catalogue: Catalogue): CardResolution {
  if (componentIds.length === 0) return { status: 'empty' }

  const errors: ResolutionError[] = []
  const quantities = new Map<string, { entry: CatalogueEntry; quantity: number }>()
  const dice = new Map<string, DiceTotal>()
  let rangeFeet: number | null = null
  let totalPointCost = 0

  componentIds.forEach((id, index) => {
    const position = index + 1
    const lookup = catalogue.get(id)
    if (lookup.status === 'missing') {
      errors.push({
        position,
        id,
        message: `Position ${position}: "${id}" is not in the catalogue. Remove it from the card or add it to catalogue/catalogue.json.`,
      })
      return
    }

    const { entry } = lookup
    totalPointCost += entry.pointCost
    const existing = quantities.get(id)
    quantities.set(id, { entry, quantity: (existing?.quantity ?? 0) + 1 })

    for (const effect of entry.effects) {
      switch (effect.kind) {
        case 'dice': {
          const total = dice.get(effect.damageType)
          if (!total) {
            dice.set(effect.damageType, { count: effect.count, sides: effect.sides, damageType: effect.damageType })
          } else if (total.sides !== effect.sides) {
            errors.push({
              position,
              id,
              message: `Position ${position} (${entry.name}): cannot combine ${effect.count}d${effect.sides} ${effect.damageType} with ${total.count}d${total.sides} ${effect.damageType}. Dice of the same damage type must use the same die size.`,
            })
          } else {
            total.count += effect.count
          }
          break
        }
        case 'range':
          rangeFeet = (rangeFeet ?? 0) + effect.value
          break
        default: {
          const kind = (effect as { kind: string }).kind
          errors.push({
            position,
            id,
            message: `Position ${position} (${entry.name}): effect kind "${kind}" is not supported by the resolver.`,
          })
        }
      }
    }
  })

  if (errors.length > 0) return { status: 'error', errors }

  const effects: Effect[] = Array.from(dice.values(), (d) => ({ kind: 'dice' as const, ...d }))
  if (rangeFeet !== null) effects.push({ kind: 'range', value: rangeFeet, unit: 'ft' })

  return {
    status: 'resolved',
    components: Array.from(quantities.values()),
    effects,
    totalPointCost,
    occurrences: componentIds.length,
  }
}
