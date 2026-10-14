'use client'

import { useMemo } from 'react'
import useSWR from 'swr'
import { fetchGlossary, fetchRules, GLOSSARY_URL, RULES_URL } from '@/lib/rules/fetchers'
import { buildRulesHtml } from '@/lib/rules/render'
import { RulesContent } from './rules-content'
import { RulesError } from './rules-error'
import { RulesSkeleton } from './rules-skeleton'

const SWR_OPTIONS = { revalidateOnFocus: false, shouldRetryOnError: false } as const

export function RulesView() {
  const rules = useSWR(RULES_URL, fetchRules, SWR_OPTIONS)
  const glossary = useSWR(GLOSSARY_URL, fetchGlossary, SWR_OPTIONS)

  const html = useMemo(() => {
    if (rules.data === undefined || glossary.data === undefined) return null
    return buildRulesHtml(rules.data, glossary.data.entries)
  }, [rules.data, glossary.data])

  if (rules.error) {
    return (
      <RulesError
        message={rules.error instanceof Error ? rules.error.message : 'The rules could not be loaded.'}
        retrying={rules.isValidating}
        onRetry={() => rules.mutate()}
      />
    )
  }

  if (html === null) return <RulesSkeleton />

  return (
    <div className="flex flex-col gap-4">
      {glossary.data?.status === 'error' ? (
        <p role="status" className="pixel-frame m-[3px] bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          {`Glossary unavailable: ${glossary.data.message} The rules are shown without term definitions.`}
        </p>
      ) : null}
      <RulesContent html={html} />
    </div>
  )
}
