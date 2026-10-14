'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { loadCatalogue } from '@/lib/catalogue/load'
import { SAVED_CARDS_SCHEMA_VERSION, validateCardInput } from '@/lib/cards/saved'
import { readSavedCards, writeSavedCards } from '@/lib/cards/saved-store'

export type ActionResult = { ok: true } | { ok: false; message: string }

export async function saveCard(name: string, description: string, componentIds: string[]): Promise<ActionResult> {
  const catalogue = await loadCatalogue()
  if (catalogue.status === 'error') return { ok: false, message: 'The catalogue failed to load, so the card was not saved.' }

  const knownIds = new Set(catalogue.catalogue.data.entries.map((entry) => entry.id))
  const input = validateCardInput(name, description, componentIds, knownIds)
  if (!input.ok) return input

  const current = await readSavedCards()
  if (!current.ok) return current

  try {
    await writeSavedCards({
      schemaVersion: SAVED_CARDS_SCHEMA_VERSION,
      cards: [
        ...current.file.cards,
        {
          id: randomUUID(),
          name: input.name,
          ...(input.description ? { description: input.description } : {}),
          componentIds: input.componentIds,
          savedAt: new Date().toISOString(),
        },
      ],
    })
  } catch {
    return { ok: false, message: 'The card could not be written to content/saved-cards.json.' }
  }

  revalidatePath('/cards')
  return { ok: true }
}

export async function deleteCard(id: string): Promise<ActionResult> {
  if (typeof id !== 'string' || id.length === 0) return { ok: false, message: 'Missing card id.' }

  const current = await readSavedCards()
  if (!current.ok) return current

  const cards = current.file.cards.filter((card) => card.id !== id)
  if (cards.length === current.file.cards.length) {
    return { ok: false, message: 'That card no longer exists.' }
  }

  try {
    await writeSavedCards({ schemaVersion: SAVED_CARDS_SCHEMA_VERSION, cards })
  } catch {
    return { ok: false, message: 'The card could not be removed from content/saved-cards.json.' }
  }

  revalidatePath('/cards')
  return { ok: true }
}
