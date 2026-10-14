import DOMPurify from 'dompurify'
import { Marked } from 'marked'

const parser = new Marked({ gfm: true, async: false })

/**
 * Browser-only (DOMPurify needs a DOM): converts Markdown to HTML and strips anything
 * that could run script, such as <script>, inline event handlers and javascript: URLs.
 */
export function markdownToSafeHtml(source: string): string {
  const html = parser.parse(source, { async: false })
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
}
