import type { Metadata } from 'next'
import { PageShell, PlaceholderPanel } from '@/components/page-shell'
import { readRules } from '@/lib/rules'

export const metadata: Metadata = { title: 'Rules' }

export default async function RulesPage() {
  const rules = await readRules()

  return (
    <PageShell eyebrow="Rules" title="Rules Reference" description="The rules of the game, in one place.">
      {rules === null ? (
        <PlaceholderPanel label="Rules unavailable">
          <p>The rules file could not be found. Add it at content/rules.md.</p>
        </PlaceholderPanel>
      ) : (
        <article className="pixel-frame-raised m-[3px] bg-card p-6 text-card-foreground md:p-8">
          <div className="max-w-prose whitespace-pre-wrap break-words leading-relaxed">{rules}</div>
        </article>
      )}
    </PageShell>
  )
}
