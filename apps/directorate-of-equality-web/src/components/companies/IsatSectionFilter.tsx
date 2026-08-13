'use client'

import { useMemo } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { MultiSelectFilter } from '@dmr.is/ui/components/island-is/MultiSelectFilter'

import { companiesText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'

type Props = {
  label?: string
  selected: string[]
  onChange: (codes: string[]) => void
}

/**
 * The premade industry filter: 22 ÍSAT2008 sections (bálkar) instead of 665 leaf
 * codes, so "public administration" is one choice rather than an enumeration of
 * every leaf under division 84. X (Óþekkt starfsemi) is one of the 22 — it is
 * how a company with no known activity is filed, and is not a section in the
 * ordinary sense.
 *
 * Note this filters on what a company *does*, not who owns it — a state-owned
 * hospital and a private clinic share section Q. Use the sector filter for
 * private vs government/state.
 */
export const IsatSectionFilter = ({ label, selected, onChange }: Props) => {
  const trpc = useTRPC()

  const { data, isLoading } = useQuery(
    trpc.company.isatSections.queryOptions(undefined, {
      staleTime: 60 * 60_000,
    }),
  )

  const options = useMemo(
    () =>
      (data ?? []).map((s) => ({
        value: s.code,
        label: `${s.code} – ${s.description}`,
      })),
    [data],
  )

  return (
    <MultiSelectFilter
      name="isatSection"
      label={label}
      options={options}
      selected={selected}
      isLoading={isLoading}
      placeholder={companiesText.isatSectionPlaceholder}
      noOptionsMessage={companiesText.isatSectionNoResults}
      onChange={onChange}
    />
  )
}
