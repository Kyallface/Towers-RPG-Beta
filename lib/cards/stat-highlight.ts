import type { Stat } from '@/lib/catalogue/types'

export type StatSegment = { readonly kind: 'text'; readonly text: string } | { readonly kind: 'stat'; readonly text: string; readonly stat: Stat }

const WORD_TO_STAT: Readonly<Record<string, Stat>> = {
  Phys: 'Phy',
  Phy: 'Phy',
  Int: 'Int',
  Emo: 'Emo',
  Pow: 'Pow',
  Fin: 'Fin',
}

// Letters on either side mean the stat is part of a longer word ("Physical", "Final").
// Digits and punctuation are allowed so "Phy1" and "Phy-Pow" still highlight.
const STAT_WORD = /(?<![A-Za-z])(Phys|Phy|Int|Emo|Pow|Fin)(?![A-Za-z])/g

export function splitStatWords(text: string): StatSegment[] {
  const segments: StatSegment[] = []
  let cursor = 0
  for (const match of text.matchAll(STAT_WORD)) {
    const start = match.index
    if (start > cursor) segments.push({ kind: 'text', text: text.slice(cursor, start) })
    segments.push({ kind: 'stat', text: match[0], stat: WORD_TO_STAT[match[0]] })
    cursor = start + match[0].length
  }
  if (cursor < text.length) segments.push({ kind: 'text', text: text.slice(cursor) })
  return segments
}
