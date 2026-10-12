import type { Metadata } from 'next'
import { PageShell, PlaceholderPanel } from '@/components/page-shell'

export const metadata: Metadata = { title: 'Character Sheet' }

export default function SheetPage() {
  return (
    <PageShell
      eyebrow="Sheet"
      title="Character Sheet"
      description="Track your character, their progression and the cards they carry."
    >
      <PlaceholderPanel label="Character sheet placeholder">
        <p>The character sheet will live here.</p>
      </PlaceholderPanel>
    </PageShell>
  )
}
