// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { SWRConfig } from 'swr'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchGlossary, fetchRules } from '@/lib/rules/fetchers'
import { RulesView } from './rules-view'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type Responder = (url: string) => Response | Promise<Response>

let container: HTMLDivElement
let root: Root

function mockFetch(responder: Responder) {
  vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => Promise.resolve(responder(String(input)))))
}

async function renderView() {
  await act(async () => {
    root.render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <RulesView />
      </SWRConfig>,
    )
  })
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

beforeEach(() => {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

describe('fetchers', () => {
  it('fetchRules reports a missing rules file', async () => {
    mockFetch(() => new Response('nope', { status: 404 }))
    await expect(fetchRules('/api/rules')).rejects.toThrow('content/rules.md')
  })

  it('fetchRules reports network failures', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('offline'))))
    await expect(fetchRules('/api/rules')).rejects.toThrow('could not be loaded')
  })

  it('fetchGlossary never throws for missing or malformed glossaries', async () => {
    mockFetch(() => new Response('nope', { status: 404 }))
    await expect(fetchGlossary('/api/glossary')).resolves.toMatchObject({ status: 'error', entries: [] })

    mockFetch(() => new Response('{ broken', { status: 200 }))
    await expect(fetchGlossary('/api/glossary')).resolves.toMatchObject({ status: 'error', entries: [] })

    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('offline'))))
    await expect(fetchGlossary('/api/glossary')).resolves.toMatchObject({ status: 'error', entries: [] })
  })
})

describe('RulesView', () => {
  it('renders the rules with glossary terms', async () => {
    mockFetch((url) =>
      url.includes('glossary')
        ? new Response(JSON.stringify({ CAST: 'Citizen Assessment and Social Trust.' }))
        : new Response('# Rules\n\nObey **CAST**.'),
    )
    await renderView()

    expect(container.querySelector('h1')?.textContent).toBe('Rules')
    const trigger = container.querySelector('.glossary-term')
    expect(trigger?.textContent).toBe('CAST')
    expect(container.querySelector('[role="tooltip"]')?.textContent).toContain('Citizen Assessment and Social Trust.')
    expect(container.querySelector('[role="status"]')).toBeNull()
  })

  it('still renders the rules when the glossary is missing', async () => {
    mockFetch((url) =>
      url.includes('glossary') ? new Response('missing', { status: 404 }) : new Response('Obey CAST.'),
    )
    await renderView()

    expect(container.querySelector('.rules-prose p')?.textContent).toBe('Obey CAST.')
    expect(container.querySelector('.glossary')).toBeNull()
    expect(container.querySelector('[role="status"]')?.textContent).toContain('Glossary unavailable')
  })

  it('shows an error state when the rules fail to load', async () => {
    mockFetch((url) => (url.includes('glossary') ? new Response('{}') : new Response('error', { status: 500 })))
    await renderView()

    const alert = container.querySelector('[role="alert"]')
    expect(alert?.textContent).toContain('Rules unavailable')
    expect(alert?.textContent).toContain('HTTP 500')
    expect(alert?.querySelector('button')?.textContent).toBe('Try again')
    expect(container.querySelector('.rules-prose')).toBeNull()
  })
})
