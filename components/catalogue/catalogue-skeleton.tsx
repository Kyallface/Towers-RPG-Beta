export function CatalogueSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">Loading catalogue…</span>
      <div aria-hidden="true" className="h-7 w-32 animate-pulse bg-muted" />
      <div aria-hidden="true" className="grid gap-6 sm:grid-cols-2">
        <div className="pixel-frame m-[3px] h-48 animate-pulse bg-muted" />
        <div className="pixel-frame m-[3px] h-48 animate-pulse bg-muted" />
      </div>
    </div>
  )
}
