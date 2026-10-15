export function RulesError({
  message,
  retrying,
  onRetry,
}: {
  message: string
  retrying: boolean
  onRetry: () => void
}) {
  return (
    <div role="alert" className="pixel-frame-raised m-[3px] flex flex-col items-start gap-4 bg-card p-6 text-card-foreground">
      <div className="flex flex-col gap-1">
        <p className="font-pixel text-xl">Rules unavailable</p>
        <p className="leading-relaxed text-muted-foreground">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="pixel-frame m-[3px] bg-primary px-4 py-2 font-pixel text-primary-foreground disabled:opacity-60"
      >
        {retrying ? 'Retrying…' : 'Try again'}
      </button>
    </div>
  )
}
