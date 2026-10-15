import { parseGlossaryText, type GlossaryLoadResult } from './glossary'

export const RULES_URL = '/api/rules'
export const GLOSSARY_URL = '/api/glossary'

export class RulesLoadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RulesLoadError'
  }
}

export async function fetchRules(url: string): Promise<string> {
  let response: Response
  try {
    response = await fetch(url)
  } catch {
    throw new RulesLoadError('The rules could not be loaded. Check your connection and try again.')
  }
  if (response.status === 404) {
    throw new RulesLoadError('The rules file could not be found. Add it at content/rules.md.')
  }
  if (!response.ok) {
    throw new RulesLoadError(`The rules could not be loaded (HTTP ${response.status}).`)
  }
  return response.text()
}

/** Never throws: a missing or broken glossary must not stop the rules from rendering. */
export async function fetchGlossary(url: string): Promise<GlossaryLoadResult> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      return {
        status: 'error',
        message:
          response.status === 404
            ? 'No glossary file was found at content/glossary.json.'
            : `The glossary could not be loaded (HTTP ${response.status}).`,
        entries: [],
      }
    }
    return parseGlossaryText(await response.text())
  } catch {
    return { status: 'error', message: 'The glossary could not be loaded.', entries: [] }
  }
}
