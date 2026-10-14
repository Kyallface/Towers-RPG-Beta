import { createCatalogue } from '@/lib/catalogue/catalogue'
import { loadCatalogue } from '@/lib/catalogue/load'
import { resolveCard } from '@/lib/cards/resolve'
import { readSavedCards } from '@/lib/cards/saved-store'
import { PixelLink } from '@/components/pixel-button'
import { DeleteCardButton } from './delete-card-button'
import { ResolvedCard } from './resolved-card'

function Notice({ children, alert = false }: { children: React.ReactNode; alert?: boolean }) {
  return (
    <p
      role={alert ? 'alert' : undefined}
      className={`pixel-frame m-[3px] bg-muted px-4 py-3 leading-relaxed ${alert ? 'text-accent' : 'text-muted-foreground'}`}
    >
      {children}
    </p>
  )
}

export async function SavedCards() {
  const [catalogueResult, saved] = await Promise.all([loadCatalogue(), readSavedCards()])

  if (!saved.ok) return <Notice alert>{saved.message}</Notice>
  if (catalogueResult.status === 'error') {
    return <Notice alert>Saved cards cannot be resolved until the catalogue loads: {catalogueResult.message}</Notice>
  }
  if (saved.file.cards.length === 0) {
    return (
      <div className="pixel-frame m-[3px] flex flex-col items-start gap-4 bg-muted px-5 py-6">
        <p className="leading-relaxed text-muted-foreground">No saved cards yet. Create one to see it here.</p>
        <PixelLink href="/cards/new">Create a card</PixelLink>
      </div>
    )
  }

  const catalogue = createCatalogue(catalogueResult.catalogue.data)
  const cards = [...saved.file.cards].reverse()

  return (
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <li key={card.id} className="flex">
          <div className="flex w-full flex-col">
            <ResolvedCard
              resolution={resolveCard(card.componentIds, catalogue)}
              title={card.name}
              description={card.description}
              headingId={`saved-${card.id}`}
              live={false}
              footer={<DeleteCardButton id={card.id} name={card.name} />}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
