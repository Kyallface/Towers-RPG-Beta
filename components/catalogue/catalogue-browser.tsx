import { loadCatalogue } from '@/lib/catalogue/load'
import type { CatalogueEntry, ComponentType } from '@/lib/catalogue/types'
import { CatalogueError } from './catalogue-error'
import { ComponentTile } from './component-tile'

const SECTIONS: { type: ComponentType; heading: string }[] = [
  { type: 'Form', heading: 'Forms' },
  { type: 'Modifier', heading: 'Modifiers' },
]

export async function CatalogueBrowser() {
  const result = await loadCatalogue()

  if (result.status === 'error') {
    return <CatalogueError message={result.message} issues={result.issues} />
  }

  return (
    <div className="flex flex-col gap-10">
      {SECTIONS.map(({ type, heading }) => (
        <CatalogueSection key={type} heading={heading} entries={result.catalogue.list(type)} />
      ))}
    </div>
  )
}

function CatalogueSection({ heading, entries }: { heading: string; entries: readonly CatalogueEntry[] }) {
  const headingId = `catalogue-${heading.toLowerCase()}`

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <h3 id={headingId} className="flex items-baseline gap-3 font-pixel text-2xl">
        {heading}
        <span className="text-base text-muted-foreground">
          {entries.length}
          <span className="sr-only">{entries.length === 1 ? ' component' : ' components'}</span>
        </span>
      </h3>

      {entries.length === 0 ? (
        <p className="pixel-frame m-[3px] bg-muted px-4 py-3 leading-relaxed text-muted-foreground">
          {`No ${heading} in the catalogue yet.`}
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2">
          {entries.map((entry) => (
            <li key={entry.id} className="flex">
              <ComponentTile entry={entry} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
