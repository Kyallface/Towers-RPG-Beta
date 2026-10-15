'use client'

import { X } from 'lucide-react'
import { useId } from 'react'
import { ALIGNMENTS, hasActiveFilters, type ComponentFilters } from '@/lib/cards/filter'
import { PixelButton } from '@/components/pixel-button'
import { REQUIREMENT_MAX, REQUIREMENT_MIN, REQUIREMENT_STATS_BY_TYPE } from '@/lib/catalogue/types'

const FIELD =
  'pixel-frame m-[3px] w-full bg-muted px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ring'
const LABEL = 'font-pixel text-sm uppercase tracking-widest text-muted-foreground'

export function ComponentFiltersBar({
  filters,
  onChange,
  onClear,
  resultCount,
}: {
  filters: ComponentFilters
  onChange: (filters: ComponentFilters) => void
  onClear: () => void
  resultCount: number
}) {
  const id = useId()
  const set = (key: keyof ComponentFilters) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...filters, [key]: event.target.value })

  return (
    <search aria-label="Filter Forms and Modifiers" className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-alignment`} className={LABEL}>
            Alignment
          </label>
          <select id={`${id}-alignment`} value={filters.alignment} onChange={set('alignment')} className={FIELD}>
            <option value="">All alignments</option>
            {ALIGNMENTS.map(({ code, label }) => (
              <option key={code} value={code}>
                {code} - {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-name`} className={LABEL}>
            Title
          </label>
          <input
            id={`${id}-name`}
            type="search"
            value={filters.name}
            onChange={set('name')}
            placeholder="Search by title"
            className={FIELD}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-level`} className={LABEL}>
            Level
          </label>
          <input
            id={`${id}-level`}
            type="number"
            inputMode="numeric"
            min={0}
            value={filters.level}
            onChange={set('level')}
            placeholder="Any"
            className={FIELD}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-cost`} className={LABEL}>
            Cost
          </label>
          <input
            id={`${id}-cost`}
            type="number"
            inputMode="numeric"
            min={0}
            value={filters.cost}
            onChange={set('cost')}
            placeholder="Any"
            className={FIELD}
          />
        </div>
        <RequirementFilter
          id={`${id}-form-req`}
          legend="Form REQ"
          stats={REQUIREMENT_STATS_BY_TYPE.Form}
          stat={filters.formReqStat}
          value={filters.formReqValue}
          onStatChange={set('formReqStat')}
          onValueChange={set('formReqValue')}
        />
        <RequirementFilter
          id={`${id}-mod-req`}
          legend="Mod REQ"
          stats={REQUIREMENT_STATS_BY_TYPE.Modifier}
          stat={filters.modReqStat}
          value={filters.modReqValue}
          onStatChange={set('modReqStat')}
          onValueChange={set('modReqValue')}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {hasActiveFilters(filters)
            ? `${resultCount} matching component${resultCount === 1 ? '' : 's'}`
            : `Showing all ${resultCount} components`}
        </p>
        <PixelButton type="button" variant="secondary" onClick={onClear} disabled={!hasActiveFilters(filters)}>
          <X aria-hidden="true" className="size-5" />
          Clear search
        </PixelButton>
      </div>
    </search>
  )
}

function RequirementFilter({
  id,
  legend,
  stats,
  stat,
  value,
  onStatChange,
  onValueChange,
}: {
  id: string
  legend: string
  stats: readonly string[]
  stat: string
  value: string
  onStatChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
  onValueChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className={LABEL}>{legend}</legend>
      <div className="flex gap-2">
        <label htmlFor={`${id}-stat`} className="sr-only">
          {legend} letter
        </label>
        <select id={`${id}-stat`} value={stat} onChange={onStatChange} className={`${FIELD} basis-1/2`}>
          <option value="">Any</option>
          {stats.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
        <label htmlFor={`${id}-value`} className="sr-only">
          {legend} number
        </label>
        <input
          id={`${id}-value`}
          type="number"
          inputMode="numeric"
          min={REQUIREMENT_MIN}
          max={REQUIREMENT_MAX}
          value={value}
          onChange={onValueChange}
          placeholder="Any"
          className={`${FIELD} basis-1/2`}
        />
      </div>
    </fieldset>
  )
}
