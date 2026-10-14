export interface GlossaryEntry {
  term: string
  definition: string
  /** Acronyms (terms with no lowercase letters, e.g. "CAST") only match their exact casing. */
  caseSensitive: boolean
}

export type GlossaryLoadResult =
  | { status: 'ready'; entries: GlossaryEntry[]; skipped: string[] }
  | { status: 'error'; message: string; entries: [] }

export interface GlossaryMatch {
  start: number
  end: number
  text: string
  entry: GlossaryEntry
}

export interface GlossaryMatcher {
  find(text: string): GlossaryMatch[]
}

/** Text inside these elements is never turned into glossary terms. */
export const GLOSSARY_SKIP_SELECTOR = 'a, button, code, pre, kbd, samp, script, style, textarea, h1, h2, h3, h4, h5, h6, .glossary'

const WORD_CHAR = '[\\p{L}\\p{N}_]'

function normaliseSpaces(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function isAcronym(term: string): boolean {
  const letters = term.replace(/[^\p{L}]/gu, '')
  return letters.length >= 2 && letters === letters.toUpperCase() && letters !== letters.toLowerCase()
}

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function parseGlossaryText(text: string): GlossaryLoadResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { status: 'error', message: 'The glossary file is not valid JSON.', entries: [] }
  }
  return parseGlossary(data)
}

export function parseGlossary(data: unknown): GlossaryLoadResult {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return {
      status: 'error',
      message: 'The glossary must be a JSON object mapping each term to its definition.',
      entries: [],
    }
  }

  const entries: GlossaryEntry[] = []
  const skipped: string[] = []
  const seen = new Set<string>()

  for (const [rawTerm, rawDefinition] of Object.entries(data)) {
    const term = normaliseSpaces(rawTerm)
    const definition = typeof rawDefinition === 'string' ? rawDefinition.trim() : ''
    const key = term.toLowerCase()
    if (!term || !definition || seen.has(key)) {
      skipped.push(rawTerm)
      continue
    }
    seen.add(key)
    entries.push({ term, definition, caseSensitive: isAcronym(term) })
  }

  return { status: 'ready', entries, skipped }
}

/**
 * Builds a whole-word matcher. Longer terms win over shorter ones that start at the
 * same position ("Stained Glass" beats "Stained"), and every occurrence is matched.
 */
export function createGlossaryMatcher(entries: readonly GlossaryEntry[]): GlossaryMatcher | null {
  if (entries.length === 0) return null

  const exact = new Map<string, GlossaryEntry>()
  const folded = new Map<string, GlossaryEntry>()
  for (const entry of entries) {
    if (entry.caseSensitive) exact.set(entry.term, entry)
    else folded.set(entry.term.toLowerCase(), entry)
  }

  const alternatives = [...entries]
    .sort((a, b) => b.term.length - a.term.length)
    .map((entry) => entry.term.split(' ').map(escapeForRegExp).join('\\s+'))
  const source = `(?<!${WORD_CHAR})(?:${alternatives.join('|')})(?!${WORD_CHAR})`

  return {
    find(text) {
      const pattern = new RegExp(source, 'giu')
      const matches: GlossaryMatch[] = []
      let found: RegExpExecArray | null
      while ((found = pattern.exec(text)) !== null) {
        const value = normaliseSpaces(found[0])
        const entry = exact.get(value) ?? folded.get(value.toLowerCase())
        if (!entry) {
          // Case-insensitive search hit a case-sensitive term in the wrong case; retry one character on.
          pattern.lastIndex = found.index + 1
          continue
        }
        matches.push({ start: found.index, end: found.index + found[0].length, text: found[0], entry })
      }
      return matches
    },
  }
}

function collectTextNodes(node: Node, out: Text[]) {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      out.push(child as Text)
    } else if (child.nodeType === Node.ELEMENT_NODE && !(child as Element).matches(GLOSSARY_SKIP_SELECTOR)) {
      collectTextNodes(child, out)
    }
  }
}

function createTermElement(doc: Document, match: GlossaryMatch, id: string): HTMLElement {
  const wrapper = doc.createElement('span')
  wrapper.className = 'glossary'
  wrapper.dataset.state = 'closed'

  const trigger = doc.createElement('button')
  trigger.type = 'button'
  trigger.className = 'glossary-term'
  trigger.dataset.term = match.entry.term
  trigger.setAttribute('aria-describedby', `${id}-definition`)
  trigger.textContent = match.text

  const tip = doc.createElement('span')
  tip.className = 'glossary-tip'
  tip.id = id
  tip.setAttribute('role', 'tooltip')
  tip.hidden = true

  const label = doc.createElement('span')
  label.className = 'glossary-tip-term'
  label.textContent = match.entry.term

  const definition = doc.createElement('span')
  definition.className = 'glossary-tip-definition'
  definition.id = `${id}-definition`
  definition.textContent = match.entry.definition

  tip.append(label, definition)
  wrapper.append(trigger, tip)
  return wrapper
}

/**
 * Walks the rendered text nodes under `root` and wraps glossary terms in accessible
 * tooltip triggers. Only text nodes are touched, so tags, attributes and URLs are left
 * exactly as they were. Returns the number of terms marked.
 */
export function applyGlossary(root: ParentNode & Node, matcher: GlossaryMatcher, idPrefix = 'glossary'): number {
  const doc = root.ownerDocument ?? (root as unknown as Document)
  const textNodes: Text[] = []
  collectTextNodes(root, textNodes)

  let count = 0
  for (const node of textNodes) {
    const matches = matcher.find(node.data)
    if (matches.length === 0) continue

    const fragment = doc.createDocumentFragment()
    let cursor = 0
    for (const match of matches) {
      if (match.start > cursor) fragment.append(node.data.slice(cursor, match.start))
      fragment.append(createTermElement(doc, match, `${idPrefix}-${count}`))
      count += 1
      cursor = match.end
    }
    if (cursor < node.data.length) fragment.append(node.data.slice(cursor))
    node.replaceWith(fragment)
  }
  return count
}
