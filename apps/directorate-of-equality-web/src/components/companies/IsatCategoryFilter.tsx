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

// The full ÍSAT2008 list (~665 leaf codes) is reference data — loaded once and
// searched client-side by the Select itself (the design-system Select filters
// in-browser, so server-side search isn't available here).
export const IsatCategoryFilter = ({ label, selected, onChange }: Props) => {
  const trpc = useTRPC()

  const { data, isLoading } = useQuery(
    trpc.company.isatCategories.queryOptions(undefined, {
      staleTime: 60 * 60_000,
    }),
  )

  const options = useMemo(
    () =>
      (data ?? []).map((c) => ({
        value: c.code,
        label: `${c.codeDotted} – ${c.description}`,
      })),
    [data],
  )

  return (
    <MultiSelectFilter
      name="isatCategory"
      label={label}
      options={options}
      selected={selected}
      isLoading={isLoading}
      placeholder={companiesText.isatCategoryPlaceholder}
      noOptionsMessage={companiesText.isatCategoryNoResults}
      onChange={onChange}
    />
  )
}
