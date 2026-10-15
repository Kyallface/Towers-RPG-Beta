import type { Metadata } from 'next'
import { PageShell } from '@/components/page-shell'
import { RulesView } from '@/components/rules/rules-view'

export const metadata: Metadata = { title: 'Rules' }

export default function RulesPage() {
  return (
    <PageShell eyebrow="Rules" title="Rules Reference" description="The rules of the game, in one place.">
      <RulesView />
    </PageShell>
  )
}
