'use client'

import { useEffect, useMemo, type MouseEvent } from 'react'
import { nestHeadings, type HeadingNode, type RulesHeading } from '@/lib/rules/headings'

function scrollToHeading(id: string): boolean {
  const target = document.getElementById(id)
  if (!target) return false
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  target.focus({ preventScroll: true })
  return true
}

function HeadingList({ nodes, depth }: { nodes: HeadingNode[]; depth: number }) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (!scrollToHeading(id)) return
    event.preventDefault()
    window.history.replaceState(null, '', `#${id}`)
  }

  return (
    <ul className={depth === 0 ? 'flex flex-col gap-1' : 'flex flex-col gap-1 border-l-2 border-muted pl-3'}>
      {nodes.map((node) => (
        <li key={node.id} className="flex flex-col gap-1">
          <a
            href={`#${node.id}`}
            onClick={(event) => handleClick(event, node.id)}
            data-heading-level={node.level}
            className={
              depth === 0
                ? 'block py-0.5 font-pixel leading-snug text-foreground hover:text-primary focus-visible:text-primary'
                : 'block py-0.5 text-sm leading-snug text-muted-foreground hover:text-primary focus-visible:text-primary'
            }
          >
            {node.text}
          </a>
          {node.children.length > 0 ? <HeadingList nodes={node.children} depth={depth + 1} /> : null}
        </li>
      ))}
    </ul>
  )
}

export function RulesNav({ headings }: { headings: readonly RulesHeading[] }) {
  const tree = useMemo(() => nestHeadings(headings), [headings])

  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (id) scrollToHeading(id)
  }, [])

  if (tree.length === 0) return null

  return (
    <aside className="lg:sticky lg:top-6 lg:w-64 lg:shrink-0">
      <nav
        aria-labelledby="rules-nav-heading"
        className="pixel-frame-raised m-[3px] flex flex-col gap-3 bg-card p-4 text-card-foreground lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto"
      >
        <h2 id="rules-nav-heading" className="font-pixel text-xs uppercase tracking-widest text-primary">
          Contents
        </h2>
        <HeadingList nodes={tree} depth={0} />
      </nav>
    </aside>
  )
}
