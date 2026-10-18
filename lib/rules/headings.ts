export type HeadingLevel = 1 | 2 | 3

export interface RulesHeading {
  id: string
  text: string
  level: HeadingLevel
}

export interface HeadingNode extends RulesHeading {
  children: HeadingNode[]
}

const HEADING_SELECTOR = 'h1, h2, h3'

/** Prefixed so generated ids can never clobber document globals such as `location`. */
const ID_PREFIX = 'rules-'

export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Gives every `#`, `##` and `###` heading a unique id (and makes it focusable so the
 * sidebar can move keyboard focus to it), returning the headings in document order.
 */
export function assignHeadingIds(root: ParentNode): RulesHeading[] {
  const used = new Set<string>()
  const headings: RulesHeading[] = []

  for (const element of root.querySelectorAll<HTMLElement>(HEADING_SELECTOR)) {
    const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim()
    if (!text) continue

    const base = `${ID_PREFIX}${slugify(text) || 'section'}`
    let id = base
    for (let suffix = 2; used.has(id); suffix++) id = `${base}-${suffix}`
    used.add(id)

    element.id = id
    element.setAttribute('tabindex', '-1')
    headings.push({ id, text, level: Number(element.tagName.charAt(1)) as HeadingLevel })
  }

  return headings
}

/** Nests each heading under the nearest preceding heading of a higher level (e.g. ## under #). */
export function nestHeadings(headings: readonly RulesHeading[]): HeadingNode[] {
  const roots: HeadingNode[] = []
  const stack: HeadingNode[] = []

  for (const heading of headings) {
    const node: HeadingNode = { ...heading, children: [] }
    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) stack.pop()

    const parent = stack[stack.length - 1]
    if (parent) parent.children.push(node)
    else roots.push(node)

    stack.push(node)
  }

  return roots
}
