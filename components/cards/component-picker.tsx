import { Plus } from 'lucide-react'
import { formatEffect } from '@/lib/catalogue/format'
import type { CatalogueEntry, ComponentType } from '@/lib/catalogue/types'

export function ComponentPicker({
  type,
  heading,
  entries,
  onAdd,
  emptyMessage,
}: {
  type: ComponentType
  heading: string
  entries: readonly CatalogueEntry[]
  onAdd: (id: string, type: ComponentType) => void
  emptyMessage?: string
}) {
  const headingId = `picker-${type.toLowerCase()}`

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h3 id={headingId} className="font-pixel text-xl">
        {heading}
      </h3>
      {entries.length === 0 ? (
        <p className="leading-relaxed text-muted-foreground">{emptyMessage ?? `No ${type}s in the catalogue yet.`}</p>
      ) : (
        <ul className="flex flex-wrap gap-3">
          {entries.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onAdd(entry.id, type)}
                className="pixel-frame m-[3px] flex items-center gap-3 bg-card px-4 py-2 text-left text-card-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Plus aria-hidden="true" className="size-4 shrink-0" />
                <span className="flex flex-col">
                  <span className="font-pixel text-lg leading-tight">
                    <span className="sr-only">Add </span>
                    {entry.name}
                  </span>
                  <span className="text-sm opacity-80">
                    {entry.effects.map(formatEffect).join(', ')} · {entry.cost} pts · Lv {entry.level} ·{' '}
                    {entry.alignment}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
