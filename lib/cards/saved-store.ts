import { readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { EMPTY_SAVED_CARDS, parseSavedCards, type ParseSavedCardsResult, type SavedCardsFile } from './saved'

const SAVED_CARDS_PATH = path.join(process.cwd(), 'content', 'saved-cards.json')

export async function readSavedCards(): Promise<ParseSavedCardsResult> {
  let text: string
  try {
    text = await readFile(SAVED_CARDS_PATH, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { ok: true, file: EMPTY_SAVED_CARDS }
    return { ok: false, message: 'content/saved-cards.json could not be read.' }
  }
  return parseSavedCards(text)
}

/** Writes via a temp file + rename so a failed write never leaves a half-written JSON file. */
export async function writeSavedCards(file: SavedCardsFile): Promise<void> {
  const tempPath = `${SAVED_CARDS_PATH}.tmp`
  await writeFile(tempPath, `${JSON.stringify(file, null, 2)}\n`, 'utf8')
  await rename(tempPath, SAVED_CARDS_PATH)
}
