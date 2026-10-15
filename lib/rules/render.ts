import { applyGlossary, createGlossaryMatcher, type GlossaryEntry } from './glossary'
import { markdownToSafeHtml } from './markdown'

/** Browser-only: sanitised rules HTML with glossary terms marked up as tooltip triggers. */
export function buildRulesHtml(markdown: string, glossary: readonly GlossaryEntry[], doc: Document = document): string {
  const template = doc.createElement('template')
  template.innerHTML = markdownToSafeHtml(markdown)

  const matcher = createGlossaryMatcher(glossary)
  if (matcher) applyGlossary(template.content, matcher, 'glossary-tip')

  return template.innerHTML
}
