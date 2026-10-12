import type { Metadata } from 'next'
import { PageShell, PlaceholderPanel } from '@/components/page-shell'

export const metadata: Metadata = { title: 'Cards' }

export default function CardsPage() {
  return (
    <PageShell
      eyebrow="Cards"
      title="Card Builder"
      description="Stack Forms and Modifiers from the catalogue to build and resolve cards."
    >
      <PlaceholderPanel label="Card builder placeholder">
        <p>The card catalogue and builder will live here.</p>
      </PlaceholderPanel>
    </PageShell>
  )
}
