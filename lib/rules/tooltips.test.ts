// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildRulesHtml } from './render'
import { attachGlossaryTooltips } from './tooltips'

const ENTRIES = [
  { term: 'CAST', definition: 'The Citizen Assessment and Social Trust system.', caseSensitive: true },
  { term: 'Stained', definition: 'Marked by the system.', caseSensitive: false },
]

let container: HTMLDivElement
let detach: () => void

function pointer(type: string, target: Element, pointerType: string, relatedTarget: Element | null = null) {
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType, relatedTarget }))
}

function tipFor(trigger: Element) {
  return trigger.closest('.glossary')!.querySelector<HTMLElement>('[role="tooltip"]')!
}

function triggers() {
  return Array.from(container.querySelectorAll<HTMLButtonElement>('.glossary-term'))
}

beforeEach(() => {
  container = document.createElement('div')
  container.innerHTML = buildRulesHtml('CAST tracks who is Stained.\n\nOutside text.', ENTRIES)
  document.body.append(container)
  detach = attachGlossaryTooltips(container)
})

afterEach(() => {
  detach()
  container.remove()
})

describe('glossary tooltips', () => {
  it('holds the correct definition for each term', () => {
    const [cast, stained] = triggers()
    expect(tipFor(cast).textContent).toContain(ENTRIES[0].definition)
    expect(tipFor(stained).textContent).toContain(ENTRIES[1].definition)
  })

  it('shows on mouse hover and hides when the pointer leaves', () => {
    const [cast] = triggers()
    const outside = container.querySelectorAll('p')[1]
    expect(tipFor(cast).hidden).toBe(true)

    pointer('pointerover', cast, 'mouse')
    expect(tipFor(cast).hidden).toBe(false)

    pointer('pointerout', cast, 'mouse', outside)
    expect(tipFor(cast).hidden).toBe(true)
  })

  it('stays open while the pointer moves onto the tooltip', () => {
    const [cast] = triggers()
    pointer('pointerover', cast, 'mouse')
    pointer('pointerout', cast, 'mouse', tipFor(cast))
    expect(tipFor(cast).hidden).toBe(false)
  })

  it('shows on keyboard focus and hides on blur', () => {
    const [cast, stained] = triggers()
    cast.focus()
    expect(tipFor(cast).hidden).toBe(false)

    stained.focus()
    expect(tipFor(cast).hidden).toBe(true)
    expect(tipFor(stained).hidden).toBe(false)

    stained.blur()
    expect(tipFor(stained).hidden).toBe(true)
  })

  it('closes on Escape', () => {
    const [cast] = triggers()
    cast.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(tipFor(cast).hidden).toBe(true)
  })

  it('toggles on tap and closes when tapping elsewhere', () => {
    const [cast] = triggers()
    pointer('pointerover', cast, 'touch')
    expect(tipFor(cast).hidden).toBe(true)

    cast.click()
    expect(tipFor(cast).hidden).toBe(false)

    cast.click()
    expect(tipFor(cast).hidden).toBe(true)

    cast.click()
    pointer('pointerdown', document.body, 'touch')
    expect(tipFor(cast).hidden).toBe(true)
  })

  it('keeps only one tooltip open at a time', () => {
    const [cast, stained] = triggers()
    cast.click()
    stained.click()
    expect(tipFor(cast).hidden).toBe(true)
    expect(tipFor(stained).hidden).toBe(false)
  })

  it('stops responding after cleanup', () => {
    detach()
    const [cast] = triggers()
    cast.click()
    expect(tipFor(cast).hidden).toBe(true)
    detach = () => {}
  })
})
