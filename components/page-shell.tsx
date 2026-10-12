export function PageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="font-pixel text-sm uppercase tracking-widest text-primary">{eyebrow}</p>
        <h1 className="font-pixel text-4xl leading-tight text-balance md:text-5xl">{title}</h1>
        <p className="max-w-prose leading-relaxed text-muted-foreground text-pretty">{description}</p>
      </header>
      {children}
    </div>
  )
}

export function PlaceholderPanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section
      aria-label={label}
      className="pixel-frame-raised m-[3px] flex flex-col gap-3 bg-card p-6 text-card-foreground md:p-8"
    >
      <span className="w-fit bg-accent px-2 py-0.5 font-pixel text-xs uppercase tracking-widest text-accent-foreground">
        Placeholder
      </span>
      <div className="leading-relaxed text-muted-foreground">{children}</div>
    </section>
  )
}
