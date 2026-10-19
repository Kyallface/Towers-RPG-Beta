import type { Metadata } from 'next'
import { PageShell } from '@/components/page-shell'
import { RulesFooter } from '@/components/rules/rules-footer'
import { RulesView } from '@/components/rules/rules-view'
import { formatRulesDate } from '@/lib/rules/last-updated'
import { readRulesModifiedAt } from '@/lib/rules/source'

export const metadata: Metadata = { title: 'Rules' }

export default async function RulesPage() {
  const modifiedAt = await readRulesModifiedAt()

  return (
    <PageShell eyebrow="Rules" title="Rules Reference" description="The rules of the game, in one place.">
      <RulesView />
      <RulesFooter lastUpdated={modifiedAt ? formatRulesDate(modifiedAt) : null} />
    </PageShell>
  )
}
