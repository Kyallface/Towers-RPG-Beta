'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Layers, ScrollText } from 'lucide-react'

const sections = [
  { href: '/rules', label: 'Rules', icon: BookOpen },
  { href: '/sheet', label: 'Sheet', icon: ScrollText },
  { href: '/cards', label: 'Cards', icon: Layers },
] as const

export function SectionTabs() {
  const pathname = usePathname()

  return (
    <nav aria-label="Sections" className="-mb-[3px]">
      <ul className="flex gap-1">
        {sections.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 border-[3px] border-b-0 px-4 py-2 font-pixel text-base transition-colors md:px-5 ${
                  active
                    ? 'border-border bg-card text-foreground'
                    : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className={`size-4 ${active ? 'text-primary' : ''}`} aria-hidden="true" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
