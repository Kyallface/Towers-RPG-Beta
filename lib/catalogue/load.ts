import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { cache } from 'react'
import { parseCatalogue, type CatalogueLoadResult } from './catalogue'

const CATALOGUE_PATH = path.join(process.cwd(), 'content', 'catalogue.json')

/** Server-only: reads the repository catalogue once per request and validates it before exposing it. */
export const loadCatalogue = cache(async (): Promise<CatalogueLoadResult> => {
  let text: string
  try {
    text = await readFile(CATALOGUE_PATH, 'utf8')
  } catch {
    return {
      status: 'error',
      reason: 'unavailable',
      message: 'The catalogue file could not be read. Expected it at content/catalogue.json.',
      issues: [],
    }
  }
  return parseCatalogue(text)
})
