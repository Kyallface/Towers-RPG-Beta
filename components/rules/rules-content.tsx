'use client'

import { useEffect, useRef } from 'react'
import { attachGlossaryTooltips } from '@/lib/rules/tooltips'

/** `html` must already be sanitised (see buildRulesHtml). */
export function RulesContent({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    return attachGlossaryTooltips(containerRef.current)
  }, [])

  return (
    <article className="pixel-frame-raised m-[3px] bg-card p-6 text-card-foreground md:p-8">
      <div ref={containerRef} className="rules-prose max-w-prose" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  )
}
