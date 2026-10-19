// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { assignHeadingIds, nestHeadings, slugify } from './headings'
import { buildRulesDocument } from './render'

function fragment(html: string): DocumentFragment {
  const template = document.createElement('template')
  template.innerHTML = html
  return template.content
}

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Combat & Damage: Basics')).toBe('combat-damage-basics')
    expect(slugify('Café Rules')).toBe('cafe-rules')
  })
})

describe('assignHeadingIds', () => {
  it('detects #, ## and ### headings only, in order', () => {
    const root = fragment('<h1>One</h1><p>x</p><h2>Two</h2><h3>Three</h3><h4>Four</h4>')
    expect(assignHeadingIds(root).map((h) => [h.level, h.text])).toEqual([
      [1, 'One'],
      [2, 'Two'],
      [3, 'Three'],
    ])
  })

  it('gives each heading a unique, prefixed, focusable id', () => {
    const root = fragment('<h2>Setup</h2><h2>Setup</h2><h2>!!!</h2>')
    const headings = assignHeadingIds(root)
    expect(headings.map((h) => h.id)).toEqual(['rules-setup', 'rules-setup-2', 'rules-section'])
    const first = root.querySelector('h2')!
    expect(first.id).toBe('rules-setup')
    expect(first.getAttribute('tabindex')).toBe('-1')
  })

  it('skips empty headings', () => {
    expect(assignHeadingIds(fragment('<h2>  </h2><h2>Real</h2>'))).toHaveLength(1)
  })
})

describe('nestHeadings', () => {
  it('nests headings by markdown level', () => {
    const tree = nestHeadings([
      { id: 'a', text: 'A', level: 1 },
      { id: 'b', text: 'B', level: 2 },
      { id: 'c', text: 'C', level: 3 },
      { id: 'd', text: 'D', level: 2 },
      { id: 'e', text: 'E', level: 1 },
    ])
    expect(tree.map((n) => n.id)).toEqual(['a', 'e'])
    expect(tree[0].children.map((n) => n.id)).toEqual(['b', 'd'])
    expect(tree[0].children[0].children.map((n) => n.id)).toEqual(['c'])
    expect(tree[1].children).toEqual([])
  })

  it('attaches skipped levels to the nearest higher heading', () => {
    const tree = nestHeadings([
      { id: 'a', text: 'A', level: 1 },
      { id: 'c', text: 'C', level: 3 },
    ])
    expect(tree[0].children.map((n) => n.id)).toEqual(['c'])
  })

  it('keeps leading lower-level headings at the top level', () => {
    const tree = nestHeadings([
      { id: 'b', text: 'B', level: 2 },
      { id: 'a', text: 'A', level: 1 },
    ])
    expect(tree.map((n) => n.id)).toEqual(['b', 'a'])
  })
})

describe('buildRulesDocument', () => {
  it('returns headings whose ids exist in the rendered HTML', () => {
    const doc = buildRulesDocument('# Rules\n\n## Combat\n\n### Damage\n\ntext', [])
    expect(doc.headings.map((h) => h.id)).toEqual(['rules-rules', 'rules-combat', 'rules-damage'])
    const rendered = fragment(doc.html)
    for (const heading of doc.headings) expect(rendered.getElementById?.(heading.id) ?? rendered.querySelector(`#${heading.id}`)).not.toBeNull()
  })
})
