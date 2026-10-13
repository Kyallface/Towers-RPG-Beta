import type { Effect } from './types'

export function formatEffect(effect: Effect): string {
  switch (effect.kind) {
    case 'dice':
      return `${effect.count}d${effect.sides} ${effect.damageType}`
    case 'range':
      return `${effect.value} ${effect.unit} range`
  }
}
