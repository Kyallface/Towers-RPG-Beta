import { formatEffect } from '@/lib/catalogue/format'
import type { CardResolution } from '@/lib/cards/resolve'

export function ResolvedCard({ resolution }: { resolution: CardResolution }) {
  return (
    <section
      aria-labelledby="resolved-heading"
      aria-live="polite"
      className="pixel-frame-raised m-[3px] flex flex-col bg-card text-card-foreground"
    >
      <header className="flex items-center justify-between gap-3 bg-primary px-5 py-3 text-primary-foreground">
        <h3 id="resolved-heading" className="font-pixel text-xl">
          Resolved card
        </h3>
        {resolution.status === 'resolved' ? (
          <span className="font-pixel text-lg">{resolution.totalPointCost} pts</span>
        ) : null}
      </header>

      <div className="pixel-grid flex flex-col gap-5 p-5">
        {resolution.status === 'empty' ? (
          <p className="leading-relaxed text-muted-foreground">
            This card is empty. Add components to see its combined effects and cost.
          </p>
        ) : resolution.status === 'error' ? (
          <div role="alert" className="flex flex-col gap-3">
            <p className="font-pixel text-lg text-accent">Card cannot be resolved</p>
            <ul className="flex flex-col gap-2 text-sm leading-relaxed">
              {resolution.errors.map((error, i) => (
                <li key={i}>{error.message}</li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <h4 className="font-pixel text-xs uppercase tracking-widest text-muted-foreground">Effects</h4>
              <ul className="flex flex-col gap-1">
                {resolution.effects.map((effect) => (
                  <li key={effect.kind === 'dice' ? `dice-${effect.damageType}` : effect.kind} className="font-pixel text-3xl leading-tight text-primary">
                    {formatEffect(effect)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-2 border-t-[3px] border-muted pt-4">
              <h4 className="font-pixel text-xs uppercase tracking-widest text-muted-foreground">Components</h4>
              <ul className="flex flex-col gap-1">
                {resolution.components.map(({ entry, quantity }) => (
                  <li key={entry.id} className="flex items-baseline justify-between gap-3">
                    <span>
                      {entry.name} <span className="font-pixel text-muted-foreground">{`×${quantity}`}</span>
                    </span>
                    <span className="font-pixel text-sm text-muted-foreground">{entry.pointCost * quantity} pts</span>
                  </li>
                ))}
              </ul>
            </div>

            <dl className="flex items-baseline justify-between gap-3 border-t-[3px] border-muted pt-4 font-pixel">
              <dt className="text-muted-foreground">Total cost</dt>
              <dd className="text-xl">
                {resolution.totalPointCost} pts
                <span className="sr-only">{` across ${resolution.occurrences} components`}</span>
              </dd>
            </dl>
          </>
        )}
      </div>
    </section>
  )
}
