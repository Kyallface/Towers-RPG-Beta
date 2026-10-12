import { readFile } from 'node:fs/promises'
import path from 'node:path'

const RULES_PATH = path.join(process.cwd(), 'content', 'rules.md')

export async function readRules(): Promise<string | null> {
  try {
    return await readFile(RULES_PATH, 'utf8')
  } catch {
    return null
  }
}
