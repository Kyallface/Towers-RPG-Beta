import { readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { get, put } from '@vercel/blob'
import { EMPTY_SAVED_CARDS, parseSavedCards, type ParseSavedCardsResult, type SavedCardsFile } from './saved'

const BLOB_PATHNAME = 'saved-cards/saved-cards.json'
const LOCAL_PATH = path.join(process.cwd(), 'content', 'saved-cards.json')

/**
 * Deployed functions run on a read-only filesystem, so saved cards live in Vercel Blob
 * whenever a token is configured. The local JSON file is only a fallback for offline dev.
 */
function useBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

function serialise(file: SavedCardsFile): string {
  return `${JSON.stringify(file, null, 2)}\n`
}

export async function readSavedCards(): Promise<ParseSavedCardsResult> {
  return useBlob() ? readFromBlob() : readFromDisk()
}

export async function writeSavedCards(file: SavedCardsFile): Promise<void> {
  return useBlob() ? writeToBlob(file) : writeToDisk(file)
}

async function readFromBlob(): Promise<ParseSavedCardsResult> {
  let text: string
  try {
    // useCache: false so a read straight after a save sees the new card rather than a CDN copy.
    const result = await get(BLOB_PATHNAME, { access: 'private', useCache: false })
    if (!result || result.statusCode !== 200 || !result.stream) return { ok: true, file: EMPTY_SAVED_CARDS }
    text = await new Response(result.stream).text()
  } catch (error) {
    console.error('Failed to read saved cards from Blob:', error)
    return { ok: false, message: 'Saved cards could not be loaded from storage.' }
  }
  return parseSavedCards(text)
}

async function writeToBlob(file: SavedCardsFile): Promise<void> {
  await put(BLOB_PATHNAME, serialise(file), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}

async function readFromDisk(): Promise<ParseSavedCardsResult> {
  let text: string
  try {
    text = await readFile(LOCAL_PATH, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { ok: true, file: EMPTY_SAVED_CARDS }
    return { ok: false, message: 'content/saved-cards.json could not be read.' }
  }
  return parseSavedCards(text)
}

/** Writes via a temp file + rename so a failed write never leaves a half-written JSON file. */
async function writeToDisk(file: SavedCardsFile): Promise<void> {
  const tempPath = `${LOCAL_PATH}.tmp`
  await writeFile(tempPath, serialise(file), 'utf8')
  await rename(tempPath, LOCAL_PATH)
}
