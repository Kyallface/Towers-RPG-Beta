'use client'

import { useId } from 'react'
import { PIXEL_ICONS } from '@/lib/cards/icons'
import { PixelIconGlyph } from './pixel-icon'

const TILE =
  'pixel-frame m-[3px] flex size-12 cursor-pointer items-center justify-center bg-muted text-foreground hover:text-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring'

export function IconPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const name = useId()
  const options = [{ id: '', label: 'No icon' }, ...PIXEL_ICONS]

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-pixel text-sm uppercase tracking-widest text-muted-foreground">Icon</legend>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => {
          const inputId = `${name}-${option.id || 'none'}`
          return (
            <div key={option.id || 'none'}>
              <input
                type="radio"
                id={inputId}
                name={name}
                value={option.id}
                checked={value === option.id}
                onChange={() => onChange(option.id)}
                className="peer sr-only"
              />
              <label htmlFor={inputId} title={option.label} className={TILE}>
                <span className="sr-only">{option.label}</span>
                {'pixels' in option ? (
                  <PixelIconGlyph icon={option} className="size-7" />
                ) : (
                  <span aria-hidden="true" className="font-pixel text-lg">
                    {'—'}
                  </span>
                )}
              </label>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}
