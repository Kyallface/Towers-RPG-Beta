import { readFile } from 'node:fs/promises'
import path from 'node:path'

const CONTENT_DIR = path.join(process.cwd(), 'content')

async function readContentFile(name: string): Promise<string | null> {
  try {
    return await readFile(path.join(CONTENT_DIR, name), 'utf8')
  } catch {
    return null
  }
}

/** Server-only: raw Markdown from content/rules.md, or null when the file is missing. */
export function readRules(): Promise<string | null> {
  return readContentFile('rules.md')
}

/** Server-only: raw JSON text from content/glossary.json, or null when the file is missing. */
export function readGlossary(): Promise<string | null> {
  return readContentFile('glossary.json')
}
