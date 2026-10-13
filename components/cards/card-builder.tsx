'use client'

import { useMemo, useState } from 'react'
import { createCatalogue } from '@/lib/catalogue/catalogue'
import type { CatalogueData, ComponentType } from '@/lib/catalogue/types'
import { addComponent, EMPTY_DRAFT, removeOccurrence, type CardDraft, type DraftUpdate } from '@/lib/cards/draft'
import { resolveCard } from '@/lib/cards/resolve'
import { ComponentPicker } from './component-picker'
import { DraftComponents } from './draft-components'
import { ResolvedCard } from './resolved-card'

export function CardBuilder({ data }: { data: CatalogueData }) {
  const catalogue = useMemo(() => createCatalogue(data), [data])
  const [draft, setDraft] = useState<CardDraft>(EMPTY_DRAFT)
  const [notice, setNotice] = useState<string | null>(null)

  const resolution = useMemo(() => resolveCard(draft.componentIds, catalogue), [draft, catalogue])

  function apply(update: DraftUpdate) {
    setDraft(update.draft)
    setNotice(update.ok ? null : update.message)
  }

  const handleAdd = (id: string, type: ComponentType) => apply(addComponent(draft, catalogue, id, type))
  const handleRemove = (index: number, id: string) => apply(removeOccurrence(draft, index, id))
  const handleClear = () => apply({ ok: true, draft: EMPTY_DRAFT })

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className="flex flex-1 flex-col gap-8">
        <ComponentPicker type="Form" heading="Add a Form" entries={catalogue.list('Form')} onAdd={handleAdd} />
        <ComponentPicker
          type="Modifier"
          heading="Add a Modifier"
          entries={catalogue.list('Modifier')}
          onAdd={handleAdd}
        />
        <DraftComponents
          componentIds={draft.componentIds}
          catalogue={catalogue}
          onRemove={handleRemove}
          onClear={handleClear}
        />
        <p role="status" aria-live="polite" className={notice ? 'pixel-frame m-[3px] bg-muted px-4 py-3 leading-relaxed text-accent' : 'sr-only'}>
          {notice}
        </p>
      </div>

      <div className="lg:sticky lg:top-6 lg:w-80">
        <ResolvedCard resolution={resolution} />
      </div>
    </div>
  )
}
