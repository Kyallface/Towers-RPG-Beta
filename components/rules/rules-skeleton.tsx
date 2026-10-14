export function RulesSkeleton() {
  return (
    <div role="status" aria-busy="true" className="pixel-frame-raised m-[3px] flex flex-col gap-4 bg-card p-6 md:p-8">
      <span className="sr-only">Loading rules…</span>
      <div aria-hidden="true" className="h-8 w-2/3 animate-pulse bg-muted" />
      <div aria-hidden="true" className="h-4 w-full animate-pulse bg-muted" />
      <div aria-hidden="true" className="h-4 w-11/12 animate-pulse bg-muted" />
      <div aria-hidden="true" className="h-4 w-4/5 animate-pulse bg-muted" />
    </div>
  )
}
