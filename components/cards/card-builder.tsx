'use client'

import { Eraser, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useMemo, useState, useTransition } from 'react'
import { saveCard } from '@/app/cards/actions'
import { createCatalogue } from '@/lib/catalogue/catalogue'
import type { CatalogueData, ComponentType } from '@/lib/catalogue/types'
import { addComponent, EMPTY_DRAFT, removeOccurrence, type CardDraft, type DraftUpdate } from '@/lib/cards/draft'
import { resolveCard } from '@/lib/cards/resolve'
import { MAX_CARD_NAME_LENGTH } from '@/lib/cards/saved'
import { PixelButton } from '@/components/pixel-button'
import { ComponentPicker } from './component-picker'
import { DraftComponents } from './draft-components'
import { ResolvedCard } from './resolved-card'

export function CardBuilder({ data }: { data: CatalogueData }) {
  const catalogue = useMemo(() => createCatalogue(data), [data])
  const router = useRouter()
  const nameId = useId()
  const [draft, setDraft] = useState<CardDraft>(EMPTY_DRAFT)
  const [name, setName] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [isSaving, startSaving] = useTransition()

  const resolution = useMemo(() => resolveCard(draft.componentIds, catalogue), [draft, catalogue])
  const canSave = resolution.status === 'resolved' && name.trim().length > 0 && !isSaving

  function apply(update: DraftUpdate) {
    setDraft(update.draft)
    setNotice(update.ok ? null : update.message)
  }

  const handleAdd = (id: string, type: ComponentType) => apply(addComponent(draft, catalogue, id, type))
  const handleRemove = (index: number, id: string) => apply(removeOccurrence(draft, index, id))
  const handleClear = () => {
    apply({ ok: true, draft: EMPTY_DRAFT })
    setName('')
  }

  function handleSave() {
    startSaving(async () => {
      const result = await saveCard(name, [...draft.componentIds])
      if (!result.ok) {
        setNotice(result.message)
        return
      }
      router.push('/cards')
    })
  }

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
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:w-96">
        <div className="flex flex-col gap-2">
          <label htmlFor={nameId} className="font-pixel text-sm uppercase tracking-widest text-muted-foreground">
            Card name
          </label>
          <input
            id={nameId}
            value={name}
            maxLength={MAX_CARD_NAME_LENGTH}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Ember Lance"
            className="pixel-frame m-[3px] bg-muted px-3 py-2 font-pixel text-lg text-foreground placeholder:text-muted-foreground focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <PixelButton type="button" onClick={handleSave} disabled={!canSave} className="flex-1">
            <Save aria-hidden="true" className="size-5" />
            {isSaving ? 'Saving…' : 'Save card'}
          </PixelButton>
          <PixelButton
            type="button"
            variant="secondary"
            onClick={handleClear}
            disabled={draft.componentIds.length === 0 && name.length === 0}
          >
            <Eraser aria-hidden="true" className="size-5" />
            Clear
          </PixelButton>
        </div>

        <p
          role="status"
          aria-live="polite"
          className={notice ? 'pixel-frame m-[3px] bg-muted px-4 py-3 leading-relaxed text-accent' : 'sr-only'}
        >
          {notice}
        </p>

        <ResolvedCard resolution={resolution} title={name.trim() || 'Resolved card'} />
      </div>
    </div>
  )
}
