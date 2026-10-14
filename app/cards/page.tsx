import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SavedCards } from '@/components/cards/saved-cards'
import { CatalogueSkeleton } from '@/components/catalogue/catalogue-skeleton'
import { PageShell } from '@/components/page-shell'
import { PixelLink } from '@/components/pixel-button'

export const metadata: Metadata = { title: 'Cards' }

export default function CardsPage() {
  return (
    <PageShell eyebrow="Cards" title="Your Cards" description="Saved cards, resolved against the current catalogue.">
      <section aria-labelledby="saved-heading" className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="saved-heading" className="font-pixel text-3xl">
            Resolved cards
          </h2>
          <PixelLink href="/cards/new">
            <Plus aria-hidden="true" className="size-5" />
            Create card
          </PixelLink>
        </div>
        <Suspense fallback={<CatalogueSkeleton />}>
          <SavedCards />
        </Suspense>
      </section>
    </PageShell>
  )
}
