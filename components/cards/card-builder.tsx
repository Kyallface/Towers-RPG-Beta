'use client'

import { Eraser, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useMemo, useState, useTransition } from 'react'
import { saveCard } from '@/app/cards/actions'
import { createCatalogue } from '@/lib/catalogue/catalogue'
import type { CatalogueData, ComponentType } from '@/lib/catalogue/types'
import { addComponent, EMPTY_DRAFT, removeOccurrence, type CardDraft, type DraftUpdate } from '@/lib/cards/draft'
import { EMPTY_FILTERS, filterEntries, hasActiveFilters, type ComponentFilters } from '@/lib/cards/filter'
import { resolveCard } from '@/lib/cards/resolve'
import { ComponentFiltersBar } from './component-filters'
import { MAX_CARD_DESCRIPTION_LENGTH, MAX_CARD_NAME_LENGTH } from '@/lib/cards/saved'
import { PixelButton } from '@/components/pixel-button'
import { ComponentPicker } from './component-picker'
import { DraftComponents } from './draft-components'
import { IconPicker } from './icon-picker'
import { ResolvedCard } from './resolved-card'

export function CardBuilder({ data }: { data: CatalogueData }) {
  const catalogue = useMemo(() => createCatalogue(data), [data])
  const router = useRouter()
  const nameId = useId()
  const descriptionId = useId()
  const [draft, setDraft] = useState<CardDraft>(EMPTY_DRAFT)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [isSaving, startSaving] = useTransition()

  const [filters, setFilters] = useState<ComponentFilters>(EMPTY_FILTERS)
  const filtering = hasActiveFilters(filters)
  const forms = useMemo(() => filterEntries(catalogue.list('Form'), filters), [catalogue, filters])
  const modifiers = useMemo(() => filterEntries(catalogue.list('Modifier'), filters), [catalogue, filters])

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
    setDescription('')
    setIcon('')
  }

  function handleSave() {
    startSaving(async () => {
      const result = await saveCard(name, description, [...draft.componentIds], icon || undefined)
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
        <ComponentFiltersBar
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(EMPTY_FILTERS)}
          resultCount={forms.length + modifiers.length}
        />
        <fieldset className="flex flex-col gap-4">
          <legend className="sr-only">Card details</legend>
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor={nameId} className="font-pixel text-sm uppercase tracking-widest text-muted-foreground">
                Card name
              </label>
              <span className="font-pixel text-xs text-muted-foreground" aria-hidden="true">
                {`${name.length}/${MAX_CARD_NAME_LENGTH}`}
              </span>
            </div>
            <input
              id={nameId}
              value={name}
              maxLength={MAX_CARD_NAME_LENGTH}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Ember Lance"
              className="pixel-frame m-[3px] bg-muted px-3 py-2 font-pixel text-lg text-foreground placeholder:text-muted-foreground focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <label
                htmlFor={descriptionId}
                className="font-pixel text-sm uppercase tracking-widest text-muted-foreground"
              >
                Description
              </label>
              <span className="font-pixel text-xs text-muted-foreground" aria-hidden="true">
                {`${description.length}/${MAX_CARD_DESCRIPTION_LENGTH}`}
              </span>
            </div>
            <textarea
              id={descriptionId}
              value={description}
              maxLength={MAX_CARD_DESCRIPTION_LENGTH}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Optional flavour text or notes for this card"
              className="pixel-frame m-[3px] resize-y bg-muted px-3 py-2 leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
          </div>
          <IconPicker value={icon} onChange={setIcon} />
        </fieldset>
        <ComponentPicker
          type="Form"
          heading="Add a Form"
          entries={forms}
          onAdd={handleAdd}
          emptyMessage={filtering ? 'No Forms match the current search.' : undefined}
        />
        <ComponentPicker
          type="Modifier"
          heading="Add a Modifier"
          entries={modifiers}
          onAdd={handleAdd}
          emptyMessage={filtering ? 'No Modifiers match the current search.' : undefined}
        />
        <DraftComponents
          componentIds={draft.componentIds}
          catalogue={catalogue}
          onRemove={handleRemove}
          onClear={handleClear}
        />
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:w-96">
        <div className="flex flex-wrap gap-2">
          <PixelButton type="button" onClick={handleSave} disabled={!canSave} className="flex-1">
            <Save aria-hidden="true" className="size-5" />
            {isSaving ? 'Saving…' : 'Save card'}
          </PixelButton>
          <PixelButton
            type="button"
            variant="secondary"
            onClick={handleClear}
            disabled={draft.componentIds.length === 0 && name.length === 0 && description.length === 0 && icon === ''}
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

        <ResolvedCard
          resolution={resolution}
          title={name.trim() || 'Resolved card'}
          description={description.trim() || undefined}
          icon={icon || undefined}
        />
      </div>
    </div>
  )
}
