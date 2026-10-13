import { formatEffect } from '@/lib/catalogue/format'
import type { CatalogueEntry } from '@/lib/catalogue/types'

const TYPE_BADGE = {
  Form: 'bg-primary text-primary-foreground',
  Modifier: 'bg-accent text-accent-foreground',
} as const

export function ComponentTile({ entry }: { entry: CatalogueEntry }) {
  return (
    <article
      aria-labelledby={`component-${entry.id}`}
      className="pixel-frame-raised m-[3px] flex w-full flex-col gap-4 bg-card p-5 text-card-foreground"
    >
      <header className="flex items-start justify-between gap-3">
        <h4 id={`component-${entry.id}`} className="font-pixel text-2xl leading-tight">
          {entry.name}
        </h4>
        <span className={`shrink-0 px-2 py-0.5 font-pixel text-xs uppercase tracking-widest ${TYPE_BADGE[entry.type]}`}>
          {entry.type}
        </span>
      </header>

      <ul aria-label="Effects" className="flex flex-wrap gap-2">
        {entry.effects.map((effect, index) => (
          <li key={index} className="pixel-frame m-[3px] bg-muted px-3 py-1 font-pixel text-xl text-primary">
            {formatEffect(effect)}
          </li>
        ))}
      </ul>

      <p className="leading-relaxed text-muted-foreground text-pretty">{entry.description}</p>

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t-[3px] border-muted pt-3">
        <dl className="flex gap-6 font-pixel text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Level</dt>
            <dd>{entry.level}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Cost</dt>
            <dd>{entry.pointCost} pts</dd>
          </div>
        </dl>
        {entry.provisional ? (
          <span
            title="Level and point cost are placeholder values, not final balance."
            className="font-pixel text-xs uppercase tracking-widest text-accent"
          >
            Provisional
          </span>
        ) : null}
      </footer>
    </article>
  )
}
