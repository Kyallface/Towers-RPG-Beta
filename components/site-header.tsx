import Link from 'next/link'
import { SectionTabs } from '@/components/section-tabs'
import { ThemeToggle } from '@/components/theme-toggle'

export function SiteHeader() {
  return (
    <header className="border-b-[3px] border-border bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pt-5 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/cards" className="flex items-center gap-3">
            <TowerMark />
            <span className="font-pixel text-2xl leading-none tracking-wide">Towers</span>
          </Link>
          <ThemeToggle />
        </div>
        <SectionTabs />
      </div>
    </header>
  )
}

function TowerMark() {
  const rows = ['10101', '11111', '01110', '01010', '01110', '11111']
  return (
    <span className="grid grid-cols-5 gap-px" aria-hidden="true">
      {rows.flatMap((row, y) =>
        row.split('').map((cell, x) => (
          <span
            key={`${x}-${y}`}
            className={`size-1.5 ${cell === '1' ? 'bg-primary' : 'bg-transparent'}`}
          />
        )),
      )}
    </span>
  )
}
