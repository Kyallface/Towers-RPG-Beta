// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { applyGlossary, createGlossaryMatcher, parseGlossary, parseGlossaryText, type GlossaryEntry } from './glossary'
import { buildRulesHtml } from './render'

const ENTRIES: GlossaryEntry[] = [
  { term: 'CAST', definition: 'The Citizen Assessment and Social Trust system.', caseSensitive: true },
  { term: 'Stained', definition: 'Marked by the system.', caseSensitive: false },
  { term: 'Stained Glass', definition: 'A district of the city.', caseSensitive: false },
]

function terms(text: string) {
  return createGlossaryMatcher(ENTRIES)!.find(text).map((match) => match.entry.term)
}

function enhance(markdown: string, entries = ENTRIES) {
  const container = document.createElement('div')
  container.innerHTML = buildRulesHtml(markdown, entries)
  return container
}

describe('parseGlossary', () => {
  it('loads the repository glossary', () => {
    const text = readFileSync(path.join(__dirname, '../../content/glossary.json'), 'utf8')
    const result = parseGlossaryText(text)
    expect(result.status).toBe('ready')
    expect(result.entries.map((entry) => entry.term)).toContain('CAST')
  })

  it('treats all-caps terms as case-sensitive and others as case-insensitive', () => {
    const result = parseGlossary({ CAST: 'a', Stained: 'b' })
    expect(result.entries).toEqual([
      { term: 'CAST', definition: 'a', caseSensitive: true },
      { term: 'Stained', definition: 'b', caseSensitive: false },
    ])
  })

  it('skips empty, non-string and duplicate definitions', () => {
    const result = parseGlossary({ Good: 'yes', Empty: '', Number: 4, good: 'duplicate' })
    expect(result.status).toBe('ready')
    if (result.status === 'ready') {
      expect(result.entries.map((entry) => entry.term)).toEqual(['Good'])
      expect(result.skipped).toEqual(['Empty', 'Number', 'good'])
    }
  })

  it('reports malformed JSON and wrong shapes as errors with no entries', () => {
    expect(parseGlossaryText('{ "CAST": ')).toMatchObject({ status: 'error', entries: [] })
    expect(parseGlossary(['CAST'])).toMatchObject({ status: 'error', entries: [] })
    expect(parseGlossary(null)).toMatchObject({ status: 'error', entries: [] })
  })
})

describe('createGlossaryMatcher', () => {
  it('returns null for an empty glossary', () => {
    expect(createGlossaryMatcher([])).toBeNull()
  })

  it('detects known terms and ignores unknown ones', () => {
    expect(terms('CAST records who is Stained.')).toEqual(['CAST', 'Stained'])
    expect(terms('Nothing to see here.')).toEqual([])
  })

  it('detects every occurrence of a term', () => {
    expect(terms('Stained, stained and STAINED.')).toEqual(['Stained', 'Stained', 'Stained'])
  })

  it('respects case sensitivity for acronyms', () => {
    expect(terms('The mage will cast a spell.')).toEqual([])
    expect(terms('Cast your vote under CAST.')).toEqual(['CAST'])
  })

  it('does not match terms embedded in larger words', () => {
    expect(terms('Unstained cloth, Stainedness, CASTLE, BROADCAST, Stained_1.')).toEqual([])
  })

  it('prefers the longest matching term', () => {
    expect(terms('Visit Stained Glass today.')).toEqual(['Stained Glass'])
    expect(terms('Visit Stained\nGlass today.')).toEqual(['Stained Glass'])
  })
})

describe('applyGlossary', () => {
  it('wraps terms with accessible tooltip markup carrying the definition', () => {
    const html = enhance('Everyone answers to CAST.')
    const trigger = html.querySelector<HTMLButtonElement>('.glossary-term')!
    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger.textContent).toBe('CAST')
    const definition = html.querySelector(`#${trigger.getAttribute('aria-describedby')}`)
    expect(definition?.textContent).toBe(ENTRIES[0].definition)
    expect(definition?.closest('[role="tooltip"]')?.hasAttribute('hidden')).toBe(true)
  })

  it('gives each occurrence a unique tooltip id', () => {
    const html = enhance('CAST and CAST again. Stained under CAST.')
    const ids = Array.from(html.querySelectorAll('[role="tooltip"]')).map((tip) => tip.id)
    expect(ids).toHaveLength(4)
    expect(new Set(ids).size).toBe(4)
  })

  it('preserves surrounding text exactly', () => {
    const html = enhance('Before CAST, after Stained.')
    html.querySelectorAll('.glossary-tip').forEach((tip) => tip.remove())
    expect(html.textContent?.trim()).toBe('Before CAST, after Stained.')
  })

  it('does not modify tag names, attributes or link URLs', () => {
    const markdown = '[Read about CAST](https://example.com/CAST "CAST docs") and <span title="Stained" class="CAST">CAST</span>'
    const html = enhance(markdown)
    const link = html.querySelector('a')!
    expect(link.getAttribute('href')).toBe('https://example.com/CAST')
    expect(link.getAttribute('title')).toBe('CAST docs')
    expect(link.textContent).toBe('Read about CAST')
    expect(link.querySelector('.glossary')).toBeNull()

    const span = html.querySelector('span[title]')!
    expect(span.getAttribute('title')).toBe('Stained')
    expect(span.getAttribute('class')).toBe('CAST')
    expect(span.querySelector('.glossary-term')?.textContent).toBe('CAST')
  })

  it('keeps links functional after processing', () => {
    const html = enhance('See [the CAST rules](/rules#cast) for more on CAST.')
    const link = html.querySelector('a')!
    expect(link.getAttribute('href')).toBe('/rules#cast')
    expect(html.querySelectorAll('.glossary-term')).toHaveLength(1)
  })

  it('ignores inline code, code blocks and headings', () => {
    const html = enhance('# CAST\n\nUse `CAST` here.\n\n```\nCAST Stained\n```\n\nCAST is real.')
    expect(html.querySelector('h1')?.innerHTML).toBe('CAST')
    expect(html.querySelector('p code')?.innerHTML).toBe('CAST')
    expect(html.querySelector('pre')?.querySelector('.glossary')).toBeNull()
    expect(html.querySelectorAll('.glossary-term')).toHaveLength(1)
  })

  it('does nothing when the glossary is empty', () => {
    const html = enhance('CAST and Stained.', [])
    expect(html.querySelector('.glossary')).toBeNull()
    expect(html.textContent?.trim()).toBe('CAST and Stained.')
  })

  it('does not re-wrap already processed terms', () => {
    const container = enhance('CAST')
    const matcher = createGlossaryMatcher(ENTRIES)!
    expect(applyGlossary(container, matcher)).toBe(0)
    expect(container.querySelectorAll('.glossary')).toHaveLength(1)
  })
})
