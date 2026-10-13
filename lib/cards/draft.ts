import type { Catalogue } from '../catalogue/catalogue'
import type { ComponentType } from '../catalogue/types'

/**
 * Canonical card data: an ordered list of catalogue IDs. Duplicates are meaningful
 * (each occurrence stacks), so this is deliberately an array, never a Set or ID-keyed map.
 * Stats are never copied in; they are resolved from the current catalogue on demand.
 */
export type CardDraft = {
  readonly componentIds: readonly string[]
}

/** Display/identity data kept apart from the canonical component list. */
export type CardMetadata = {
  readonly name?: string
}

export const EMPTY_DRAFT: CardDraft = { componentIds: [] }

export type DraftUpdate =
  | { readonly ok: true; readonly draft: CardDraft }
  | { readonly ok: false; readonly draft: CardDraft; readonly message: string }

/** Appends a catalogue ID if it exists and matches the picker's component type. */
export function addComponent(
  draft: CardDraft,
  catalogue: Catalogue,
  id: string,
  expectedType: ComponentType,
): DraftUpdate {
  const lookup = catalogue.get(id)
  if (lookup.status === 'missing') {
    return {
      ok: false,
      draft,
      message: `"${id}" is not in the catalogue, so it was not added. Check catalogue/catalogue.json.`,
    }
  }
  if (lookup.entry.type !== expectedType) {
    return {
      ok: false,
      draft,
      message: `${lookup.entry.name} is a ${lookup.entry.type}, not a ${expectedType}. Add it from the ${lookup.entry.type} list.`,
    }
  }
  return { ok: true, draft: { componentIds: [...draft.componentIds, id] } }
}

/**
 * Removes exactly one occurrence at `index`. The caller passes the ID it expects there so a
 * stale target (e.g. the list changed underneath it) never removes an unrelated component.
 */
export function removeOccurrence(draft: CardDraft, index: number, expectedId: string): DraftUpdate {
  if (!Number.isInteger(index) || draft.componentIds[index] !== expectedId) {
    return {
      ok: false,
      draft,
      message: 'That component is no longer at that position on the card, so nothing was removed.',
    }
  }
  return { ok: true, draft: { componentIds: draft.componentIds.filter((_, i) => i !== index) } }
}

/** Grouped quantity control: removes one occurrence of `id` (the most recently added). */
export function removeOneOf(draft: CardDraft, id: string): DraftUpdate {
  const index = draft.componentIds.lastIndexOf(id)
  if (index === -1) {
    return { ok: false, draft, message: `"${id}" is not on this card, so nothing was removed.` }
  }
  return removeOccurrence(draft, index, id)
}

export type ComponentQuantity = {
  readonly id: string
  readonly quantity: number
}

/** Derived view: quantities per ID, in order of first appearance. */
export function groupQuantities(componentIds: readonly string[]): ComponentQuantity[] {
  const counts = new Map<string, number>()
  for (const id of componentIds) counts.set(id, (counts.get(id) ?? 0) + 1)
  return Array.from(counts, ([id, quantity]) => ({ id, quantity }))
}
