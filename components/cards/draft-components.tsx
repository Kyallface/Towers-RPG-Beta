import { X } from 'lucide-react'
import type { Catalogue } from '@/lib/catalogue/catalogue'

export function DraftComponents({
  componentIds,
  catalogue,
  onRemove,
  onClear,
}: {
  componentIds: readonly string[]
  catalogue: Catalogue
  onRemove: (index: number, id: string) => void
  onClear: () => void
}) {
  return (
    <section aria-labelledby="draft-heading" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="draft-heading" className="font-pixel text-xl">
          On this card
        </h3>
        {componentIds.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="font-pixel text-sm uppercase tracking-widest text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Clear all
          </button>
        ) : null}
      </div>

      {componentIds.length === 0 ? (
        <p className="pixel-frame m-[3px] bg-muted px-4 py-3 leading-relaxed text-muted-foreground">
          No components yet. Add a Form or Modifier above.
        </p>
      ) : (
        <ol className="flex flex-wrap gap-3">
          {componentIds.map((id, index) => {
            const lookup = catalogue.get(id)
            const name = lookup.status === 'found' ? lookup.entry.name : id
            const isForm = lookup.status === 'found' && lookup.entry.type === 'Form'
            return (
              <li
                key={`${index}-${id}`}
                className={`pixel-frame m-[3px] flex items-center gap-2 py-1 pl-3 pr-1 ${
                  lookup.status === 'missing'
                    ? 'bg-muted text-accent'
                    : isForm
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-accent text-accent-foreground'
                }`}
              >
                <span className="font-pixel text-lg">{name}</span>
                <button
                  type="button"
                  onClick={() => onRemove(index, id)}
                  aria-label={`Remove ${name} at position ${index + 1}`}
                  className="flex size-7 items-center justify-center hover:bg-background hover:text-foreground"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
