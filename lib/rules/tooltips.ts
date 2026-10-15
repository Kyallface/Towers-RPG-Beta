const VIEWPORT_MARGIN = 8

function asElement(target: EventTarget | null): Element | null {
  return target && typeof (target as Element).closest === 'function' ? (target as Element) : null
}

function glossaryFrom(target: EventTarget | null): HTMLElement | null {
  return asElement(target)?.closest<HTMLElement>('.glossary') ?? null
}

function keepInViewport(tip: HTMLElement) {
  tip.style.removeProperty('--tip-shift')
  const viewportWidth = tip.ownerDocument.documentElement.clientWidth
  if (!viewportWidth) return
  const rect = tip.getBoundingClientRect()
  let shift = 0
  if (rect.right > viewportWidth - VIEWPORT_MARGIN) shift = viewportWidth - VIEWPORT_MARGIN - rect.right
  if (rect.left + shift < VIEWPORT_MARGIN) shift = VIEWPORT_MARGIN - rect.left
  if (shift !== 0) tip.style.setProperty('--tip-shift', `${Math.round(shift)}px`)
}

/**
 * Wires up the glossary tooltips rendered by `applyGlossary` inside `container`:
 * - mouse hover and keyboard focus show the definition while the pointer/focus stays
 * - a click or tap pins it open until tapped again, tapped elsewhere or Escape is pressed
 * Returns a cleanup function.
 */
export function attachGlossaryTooltips(container: HTMLElement): () => void {
  const doc = container.ownerDocument

  function setOpen(glossary: HTMLElement, open: boolean) {
    glossary.dataset.state = open ? 'open' : 'closed'
    if (!open) delete glossary.dataset.pinned
    const tip = glossary.querySelector<HTMLElement>('.glossary-tip')
    if (!tip) return
    tip.hidden = !open
    if (open) keepInViewport(tip)
  }

  function closeAll(except?: HTMLElement) {
    container.querySelectorAll<HTMLElement>('.glossary[data-state="open"]').forEach((glossary) => {
      if (glossary !== except) setOpen(glossary, false)
    })
  }

  function open(glossary: HTMLElement) {
    closeAll(glossary)
    setOpen(glossary, true)
  }

  function closeUnlessHeld(glossary: HTMLElement, next: EventTarget | null) {
    if (glossary.dataset.pinned) return
    const nextElement = asElement(next)
    if (nextElement && glossary.contains(nextElement)) return
    setOpen(glossary, false)
  }

  function onPointerOver(event: Event) {
    if ((event as PointerEvent).pointerType === 'touch') return
    const glossary = glossaryFrom(event.target)
    if (glossary && glossary.dataset.state !== 'open') open(glossary)
  }

  function onPointerOut(event: Event) {
    if ((event as PointerEvent).pointerType === 'touch') return
    const glossary = glossaryFrom(event.target)
    if (!glossary || glossary.contains(doc.activeElement)) return
    closeUnlessHeld(glossary, (event as PointerEvent).relatedTarget)
  }

  function onFocusIn(event: FocusEvent) {
    const glossary = glossaryFrom(event.target)
    if (glossary) open(glossary)
  }

  function onFocusOut(event: FocusEvent) {
    const glossary = glossaryFrom(event.target)
    if (glossary) closeUnlessHeld(glossary, event.relatedTarget)
  }

  function onClick(event: MouseEvent) {
    const trigger = asElement(event.target)?.closest('.glossary-term')
    const glossary = trigger ? glossaryFrom(trigger) : null
    if (!glossary) return
    if (glossary.dataset.pinned) {
      setOpen(glossary, false)
      return
    }
    open(glossary)
    glossary.dataset.pinned = 'true'
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') closeAll()
  }

  function onDocumentPointerDown(event: Event) {
    const glossary = glossaryFrom(event.target)
    closeAll(glossary && container.contains(glossary) ? glossary : undefined)
  }

  container.addEventListener('pointerover', onPointerOver)
  container.addEventListener('pointerout', onPointerOut)
  container.addEventListener('focusin', onFocusIn)
  container.addEventListener('focusout', onFocusOut)
  container.addEventListener('click', onClick)
  doc.addEventListener('keydown', onKeyDown)
  doc.addEventListener('pointerdown', onDocumentPointerDown)

  return () => {
    container.removeEventListener('pointerover', onPointerOver)
    container.removeEventListener('pointerout', onPointerOut)
    container.removeEventListener('focusin', onFocusIn)
    container.removeEventListener('focusout', onFocusOut)
    container.removeEventListener('click', onClick)
    doc.removeEventListener('keydown', onKeyDown)
    doc.removeEventListener('pointerdown', onDocumentPointerDown)
  }
}
