import { describe, expect, it } from 'vitest'
import { splitStatWords } from './stat-highlight'

const stats = (text: string) =>
  splitStatWords(text)
    .filter((s) => s.kind === 'stat')
    .map((s) => (s.kind === 'stat' ? `${s.text}:${s.stat}` : ''))

describe('splitStatWords', () => {
  it('highlights each stat as a whole word', () => {
    expect(stats('Phys Int Emo Pow Fin')).toEqual(['Phys:Phy', 'Int:Int', 'Emo:Emo', 'Pow:Pow', 'Fin:Fin'])
  })

  it('highlights the short Phy label and hyphenated alignments', () => {
    expect(stats('Phy-Pow')).toEqual(['Phy:Phy', 'Pow:Pow'])
  })

  it('highlights requirement values like Phy1', () => {
    expect(stats('Phy1 Fin2')).toEqual(['Phy:Phy', 'Fin:Fin'])
  })

  it('ignores stats inside other words', () => {
    expect(stats('Physical Interest Emotion Power Final Intro Powerful')).toEqual([])
  })

  it('is case sensitive so ordinary words are not coloured', () => {
    expect(stats('the fin of a fish, pow!')).toEqual([])
  })

  it('preserves the original text exactly', () => {
    const text = 'Deal Phys damage (Pow-aligned), see Final rules.'
    expect(
      splitStatWords(text)
        .map((s) => s.text)
        .join(''),
    ).toBe(text)
  })

  it('returns a single text segment when there are no stats', () => {
    expect(splitStatWords('2d6 physical')).toEqual([{ kind: 'text', text: '2d6 physical' }])
  })
})
