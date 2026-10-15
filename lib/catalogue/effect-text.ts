import { DICE_SIDES, RANGE_UNITS, type DieSides, type Effect, type RangeUnit } from './types'

export type EffectTextResult =
  | { readonly ok: true; readonly effects: readonly Effect[] }
  | { readonly ok: false; readonly errors: readonly string[] }

const DICE_PATTERN = /^(\d+)d(\d+) ([a-z][a-z0-9]*(?:-[a-z0-9]+)*)$/
const RANGE_PATTERN = /^(\d+) ([a-z]+) range$/

export const EFFECT_TEXT_HELP = 'Write each effect as "1d6 physical" or "10 ft range"; separate several with commas.'

function parsePart(part: string): Effect | string {
  const dice = DICE_PATTERN.exec(part)
  if (dice) {
    const count = Number(dice[1])
    const sides = Number(dice[2])
    if (count < 1 || count > 20) return `"${part}": dice count must be from 1 to 20.`
    if (!DICE_SIDES.includes(sides as DieSides)) {
      return `"${part}": d${sides} is not a supported die. Use one of ${DICE_SIDES.map((s) => `d${s}`).join(', ')}.`
    }
    return Object.freeze({ kind: 'dice', count, sides: sides as DieSides, damageType: dice[3] })
  }

  const range = RANGE_PATTERN.exec(part)
  if (range) {
    const value = Number(range[1])
    if (!RANGE_UNITS.includes(range[2] as RangeUnit)) {
      return `"${part}": range must be in ${RANGE_UNITS.join(', ')}.`
    }
    if (value < 1 || value > 1000) return `"${part}": range must be from 1 to 1000 ft.`
    return Object.freeze({ kind: 'range', value, unit: range[2] as RangeUnit })
  }

  return `"${part}" is not a recognised effect. ${EFFECT_TEXT_HELP}`
}

/** Parses catalogue effect text such as "2d8 fire, 30 ft range" into structured effects. */
export function parseEffectText(text: string): EffectTextResult {
  const parts = text
    .split(',')
    .map((part) => part.trim().replace(/\s+/g, ' ').toLowerCase())
    .filter(Boolean)

  if (parts.length === 0) return { ok: false, errors: [`No effect given. ${EFFECT_TEXT_HELP}`] }

  const effects: Effect[] = []
  const errors: string[] = []
  for (const part of parts) {
    const parsed = parsePart(part)
    if (typeof parsed === 'string') errors.push(parsed)
    else effects.push(parsed)
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, effects: Object.freeze(effects) }
}
