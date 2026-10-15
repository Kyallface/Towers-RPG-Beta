import type { Effect, Requirement } from './types'

export function formatEffect(effect: Effect): string {
  switch (effect.kind) {
    case 'dice':
      return `${effect.count}d${effect.sides} ${effect.damageType}`
    case 'range':
      return `${effect.value} ${effect.unit} range`
  }
}

export function formatRequirement(requirement: Requirement): string {
  return `${requirement.stat}${requirement.value}`
}

export function formatRequirements(requirements: readonly Requirement[]): string {
  return requirements.map(formatRequirement).join(' ')
}
