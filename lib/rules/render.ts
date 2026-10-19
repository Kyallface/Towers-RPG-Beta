import { applyGlossary, createGlossaryMatcher, type GlossaryEntry } from './glossary'
import { assignHeadingIds, type RulesHeading } from './headings'
import { markdownToSafeHtml } from './markdown'

export interface RulesDocument {
  html: string
  headings: RulesHeading[]
}

/**
 * Browser-only: sanitised rules HTML with glossary terms marked up as tooltip triggers,
 * plus the `#`/`##`/`###` headings (with ids assigned) for the contents sidebar.
 */
export function buildRulesDocument(
  markdown: string,
  glossary: readonly GlossaryEntry[],
  doc: Document = document,
): RulesDocument {
  const template = doc.createElement('template')
  template.innerHTML = markdownToSafeHtml(markdown)

  const matcher = createGlossaryMatcher(glossary)
  if (matcher) applyGlossary(template.content, matcher, 'glossary-tip')

  // Ids are added after sanitising so DOMPurify cannot strip or rewrite them.
  const headings = assignHeadingIds(template.content)

  return { html: template.innerHTML, headings }
}

export function buildRulesHtml(markdown: string, glossary: readonly GlossaryEntry[], doc: Document = document): string {
  return buildRulesDocument(markdown, glossary, doc).html
}
