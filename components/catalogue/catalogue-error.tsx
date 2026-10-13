import type { CatalogueIssue } from '@/lib/catalogue/types'

export function CatalogueError({ message, issues }: { message: string; issues: readonly CatalogueIssue[] }) {
  return (
    <div role="alert" className="pixel-frame-raised m-[3px] flex flex-col gap-4 bg-card p-6 text-card-foreground">
      <div className="flex flex-col gap-1">
        <p className="font-pixel text-xl">Catalogue unavailable</p>
        <p className="leading-relaxed text-muted-foreground">{message}</p>
      </div>
      {issues.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {issues.map((issue, index) => (
            <li key={index} className="flex flex-col gap-1 bg-muted px-3 py-2 text-sm leading-relaxed">
              <code className="font-pixel text-primary">
                {issue.entry ? `${issue.entry} · ` : ''}
                {issue.path}
              </code>
              <span>{issue.message}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
