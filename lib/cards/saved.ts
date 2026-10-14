/**
 * Saved (resolved) cards persisted to content/saved-cards.json. Only the canonical
 * component ID list is stored; stats are always re-resolved from the current catalogue.
 */
export const SAVED_CARDS_SCHEMA_VERSION = 1

export type SavedCard = {
  readonly id: string
  readonly name: string
  readonly description?: string
  readonly componentIds: readonly string[]
  readonly savedAt: string
}

export type SavedCardsFile = {
  readonly schemaVersion: typeof SAVED_CARDS_SCHEMA_VERSION
  readonly cards: readonly SavedCard[]
}

export const EMPTY_SAVED_CARDS: SavedCardsFile = { schemaVersion: SAVED_CARDS_SCHEMA_VERSION, cards: [] }

export const MAX_CARD_NAME_LENGTH = 30
export const MAX_CARD_DESCRIPTION_LENGTH = 500
export const MAX_CARD_COMPONENTS = 50

export type ParseSavedCardsResult =
  | { readonly ok: true; readonly file: SavedCardsFile }
  | { readonly ok: false; readonly message: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSavedCard(value: unknown): value is SavedCard {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.name === 'string' &&
    (value.description === undefined || typeof value.description === 'string') &&
    typeof value.savedAt === 'string' &&
    Array.isArray(value.componentIds) &&
    value.componentIds.every((id) => typeof id === 'string')
  )
}

export function parseSavedCards(text: string): ParseSavedCardsResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, message: 'content/saved-cards.json is not valid JSON.' }
  }
  if (!isRecord(raw) || raw.schemaVersion !== SAVED_CARDS_SCHEMA_VERSION) {
    return {
      ok: false,
      message: `content/saved-cards.json must have "schemaVersion": ${SAVED_CARDS_SCHEMA_VERSION}.`,
    }
  }
  if (!Array.isArray(raw.cards)) {
    return { ok: false, message: 'content/saved-cards.json must have a "cards" array.' }
  }
  const invalidIndex = raw.cards.findIndex((card) => !isSavedCard(card))
  if (invalidIndex !== -1) {
    return { ok: false, message: `content/saved-cards.json: card at index ${invalidIndex} is malformed.` }
  }
  return { ok: true, file: { schemaVersion: SAVED_CARDS_SCHEMA_VERSION, cards: raw.cards as SavedCard[] } }
}

export type CardInputResult =
  | {
      readonly ok: true
      readonly name: string
      readonly description: string
      readonly componentIds: readonly string[]
    }
  | { readonly ok: false; readonly message: string }

/** Validates untrusted save input. `knownIds` comes from the current catalogue. */
export function validateCardInput(
  name: unknown,
  description: unknown,
  componentIds: unknown,
  knownIds: ReadonlySet<string>,
): CardInputResult {
  const trimmed = typeof name === 'string' ? name.trim() : ''
  if (trimmed.length === 0) return { ok: false, message: 'Give the card a name before saving.' }
  if (trimmed.length > MAX_CARD_NAME_LENGTH) {
    return { ok: false, message: `Card names can be at most ${MAX_CARD_NAME_LENGTH} characters.` }
  }
  if (description !== undefined && typeof description !== 'string') {
    return { ok: false, message: 'The card description is malformed.' }
  }
  const trimmedDescription = (description ?? '').trim()
  if (trimmedDescription.length > MAX_CARD_DESCRIPTION_LENGTH) {
    return { ok: false, message: `Descriptions can be at most ${MAX_CARD_DESCRIPTION_LENGTH} characters.` }
  }
  if (!Array.isArray(componentIds) || !componentIds.every((id) => typeof id === 'string')) {
    return { ok: false, message: 'The card data is malformed.' }
  }
  if (componentIds.length === 0) return { ok: false, message: 'Add at least one component before saving.' }
  if (componentIds.length > MAX_CARD_COMPONENTS) {
    return { ok: false, message: `A card can have at most ${MAX_CARD_COMPONENTS} components.` }
  }
  const unknown = componentIds.find((id) => !knownIds.has(id))
  if (unknown) return { ok: false, message: `"${unknown}" is not in the catalogue, so the card was not saved.` }
  return { ok: true, name: trimmed, description: trimmedDescription, componentIds: [...componentIds] }
}
