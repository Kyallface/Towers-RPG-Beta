import type { Stat } from '@/lib/catalogue/types'
import { splitStatWords } from '@/lib/cards/stat-highlight'

const STAT_COLOUR: Readonly<Record<Stat, string>> = {
  Phy: 'text-stat-phy',
  Int: 'text-stat-int',
  Emo: 'text-stat-emo',
  Pow: 'text-stat-pow',
  Fin: 'text-stat-fin',
}

/** Renders text with whole-word stat names (Phys/Phy, Int, Emo, Pow, Fin) in their stat colour. */
export function StatText({ text, inheritClassName = '' }: { text: string; inheritClassName?: string }) {
  return (
    <>
      {splitStatWords(text).map((segment, index) =>
        segment.kind === 'stat' ? (
          <span key={index} data-stat={segment.stat} className={`${STAT_COLOUR[segment.stat]} ${inheritClassName}`}>
            {segment.text}
          </span>
        ) : (
          segment.text
        ),
      )}
    </>
  )
}
