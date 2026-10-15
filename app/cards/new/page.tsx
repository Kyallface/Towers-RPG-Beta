import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CardBuilderSection } from '@/components/cards/card-builder-section'
import { CatalogueBrowser } from '@/components/catalogue/catalogue-browser'
import { CatalogueSkeleton } from '@/components/catalogue/catalogue-skeleton'
import { PageShell } from '@/components/page-shell'
import { PixelLink } from '@/components/pixel-button'

export const metadata: Metadata = { title: 'New card' }

export default function NewCardPage() {
  return (
    <PageShell
      eyebrow="Cards"
      title="Card Builder"
      description="Stack Forms and Modifiers from the catalogue, name the card and save it."
    >
      <div>
        <PixelLink href="/cards" variant="secondary">
          <ArrowLeft aria-hidden="true" className="size-5" />
          Back to cards
        </PixelLink>
      </div>

      <section aria-labelledby="builder-heading" className="flex flex-col gap-6">
        <h2 id="builder-heading" className="font-pixel text-3xl">
          Build a card
        </h2>
        <Suspense fallback={<CatalogueSkeleton />}>
          <CardBuilderSection />
        </Suspense>
      </section>

      <section aria-labelledby="catalogue-heading" className="flex flex-col gap-6">
        <h2 id="catalogue-heading" className="font-pixel text-3xl">
          Catalogue
        </h2>
        <Suspense fallback={<CatalogueSkeleton />}>
          <CatalogueBrowser />
        </Suspense>
      </section>
    </PageShell>
  )
}
