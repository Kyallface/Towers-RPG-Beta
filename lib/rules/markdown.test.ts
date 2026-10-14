// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { markdownToSafeHtml } from './markdown'

function render(markdown: string) {
  const container = document.createElement('div')
  container.innerHTML = markdownToSafeHtml(markdown)
  return container
}

describe('markdownToSafeHtml', () => {
  it('renders headings and paragraphs', () => {
    const html = render('# Title\n\n## Section\n\nSome text.')
    expect(html.querySelector('h1')?.textContent).toBe('Title')
    expect(html.querySelector('h2')?.textContent).toBe('Section')
    expect(html.querySelector('p')?.textContent).toBe('Some text.')
  })

  it('renders emphasis, lists, links, blockquotes and code', () => {
    const html = render(
      [
        'Some **bold** and *italic* text with `inline code`.',
        '',
        '- one',
        '- two',
        '',
        '1. first',
        '2. second',
        '',
        '[Docs](https://example.com/rules)',
        '',
        '> A quote',
        '',
        '```',
        'const x = 1',
        '```',
      ].join('\n'),
    )
    expect(html.querySelector('strong')?.textContent).toBe('bold')
    expect(html.querySelector('em')?.textContent).toBe('italic')
    expect(html.querySelector('p > code')?.textContent).toBe('inline code')
    expect(html.querySelectorAll('ul > li')).toHaveLength(2)
    expect(html.querySelectorAll('ol > li')).toHaveLength(2)
    expect(html.querySelector('a')?.getAttribute('href')).toBe('https://example.com/rules')
    expect(html.querySelector('blockquote')?.textContent?.trim()).toBe('A quote')
    expect(html.querySelector('pre > code')?.textContent).toContain('const x = 1')
  })

  it('renders GFM tables', () => {
    const html = render('| Stat | Value |\n| --- | --- |\n| Might | 3 |')
    expect(html.querySelectorAll('table th')).toHaveLength(2)
    expect(html.querySelector('table td')?.textContent).toBe('Might')
  })

  it('removes scripts, event handlers and javascript: URLs', () => {
    const html = render(
      [
        '<script>window.hacked = true</script>',
        '<img src="x" onerror="window.hacked = true">',
        '[click](javascript:alert(1))',
        '<a href="javascript:alert(1)">raw</a>',
        '<iframe src="https://evil.example"></iframe>',
      ].join('\n\n'),
    )
    expect(html.querySelector('script')).toBeNull()
    expect(html.querySelector('iframe')).toBeNull()
    expect(html.querySelector('img')?.hasAttribute('onerror')).toBe(false)
    html.querySelectorAll('a').forEach((link) => {
      expect(link.getAttribute('href') ?? '').not.toMatch(/^javascript:/i)
    })
    expect((window as unknown as { hacked?: boolean }).hacked).toBeUndefined()
  })
})
