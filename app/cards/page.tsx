import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CatalogueBrowser } from '@/components/catalogue/catalogue-browser'
import { CatalogueSkeleton } from '@/components/catalogue/catalogue-skeleton'
import { PageShell, PlaceholderPanel } from '@/components/page-shell'

export const metadata: Metadata = { title: 'Cards' }

export default function CardsPage() {
  return (
    <PageShell
      eyebrow="Cards"
      title="Card Builder"
      description="Stack Forms and Modifiers from the catalogue to build and resolve cards."
    >
      <section aria-labelledby="catalogue-heading" className="flex flex-col gap-6">
        <h2 id="catalogue-heading" className="font-pixel text-3xl">
          Catalogue
        </h2>
        <Suspense fallback={<CatalogueSkeleton />}>
          <CatalogueBrowser />
        </Suspense>
      </section>

      <PlaceholderPanel label="Card builder placeholder">
        <p>The card builder will let you stack these components into a card.</p>
      </PlaceholderPanel>
    </PageShell>
  )
}
