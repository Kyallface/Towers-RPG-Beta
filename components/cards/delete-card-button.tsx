'use client'

import { Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { deleteCard } from '@/app/cards/actions'
import { PixelButton } from '@/components/pixel-button'

export function DeleteCardButton({ id, name }: { id: string; name: string }) {
  const [isDeleting, startDeleting] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    startDeleting(async () => {
      const result = await deleteCard(id)
      setError(result.ok ? null : result.message)
    })
  }

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <PixelButton type="button" variant="secondary" onClick={handleDelete} disabled={isDeleting} aria-label={`Delete ${name}`}>
        <Trash2 aria-hidden="true" className="size-5" />
        {isDeleting ? 'Deleting…' : 'Delete'}
      </PixelButton>
      {error ? (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      ) : null}
    </div>
  )
}
