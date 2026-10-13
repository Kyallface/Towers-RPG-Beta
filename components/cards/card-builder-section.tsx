import { loadCatalogue } from '@/lib/catalogue/load'
import { CardBuilder } from './card-builder'

export async function CardBuilderSection() {
  const result = await loadCatalogue()

  if (result.status === 'error') {
    return (
      <p role="alert" className="pixel-frame m-[3px] bg-muted px-4 py-3 leading-relaxed text-accent">
        The card builder is unavailable until the catalogue loads. See the catalogue errors below.
      </p>
    )
  }

  return <CardBuilder data={result.catalogue.data} />
}
