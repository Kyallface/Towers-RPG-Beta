export function RulesFooter({ lastUpdated }: { lastUpdated: string | null }) {
  return (
    <footer className="border-t-2 border-muted pt-4 text-sm leading-relaxed text-muted-foreground">
      {'Rules last updated: '}
      {lastUpdated ? (
        <time dateTime={lastUpdated} className="font-pixel text-foreground">
          {lastUpdated}
        </time>
      ) : (
        <span>unknown</span>
      )}
    </footer>
  )
}
