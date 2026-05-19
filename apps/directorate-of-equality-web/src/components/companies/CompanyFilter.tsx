'use client'

import { Filter } from '@dmr.is/ui/components/island-is/Filter'
import { FilterInput } from '@dmr.is/ui/components/island-is/FilterInput'
import { FilterMultiChoice } from '@dmr.is/ui/components/island-is/FilterMultiChoice'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import {
  DAILY_FINES_FILTER_OPTIONS,
  EMPLOYEE_RANGES,
  EXPIRES_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from './companyStatus'

export type CompanyFilters = {
  employees: string[]
  status: string[]
  expires: string[]
  dailyFines: string[]
}

type Category = {
  id: keyof CompanyFilters
  label: string
  selected: string[]
  filters: { value: string; label: string }[]
}

type Props = {
  query: string
  onQueryChange: (val: string) => void
  filters: CompanyFilters
  onFiltersChange: (key: keyof CompanyFilters, val: string[]) => void
  onReset: () => void
}

export const CompanyFilter = ({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  onReset,
}: Props) => {
  const categories: Category[] = [
    {
      id: 'employees',
      label: 'Fjöldi starfsmanna',
      selected: filters.employees,
      filters: EMPLOYEE_RANGES,
    },
    {
      id: 'status',
      label: 'Staða',
      selected: filters.status,
      filters: STATUS_FILTER_OPTIONS,
    },
    {
      id: 'expires',
      label: 'Gildistími',
      selected: filters.expires,
      filters: EXPIRES_FILTER_OPTIONS,
    },
    {
      id: 'dailyFines',
      label: 'Dagsektir',
      selected: filters.dailyFines,
      filters: DAILY_FINES_FILTER_OPTIONS,
    },
  ]

  return (
    <>
      <Text variant="h5" fontWeight="semiBold" marginBottom={2}>
        Leit og síun
      </Text>
      <Filter
        labelClearAll="Hreinsa allar síur"
        labelOpen="Opna síur"
        labelClose="Loka síum"
        labelClear="Hreinsa"
        labelTitle="Síur"
        labelResult="Sýna niðurstöður"
        onFilterClear={onReset}
        variant="default"
        filterInput={
          <FilterInput
            name="query"
            placeholder="Leita að fyrirtæki..."
            value={query}
            onChange={onQueryChange}
            backgroundColor="white"
          />
        }
      >
        <FilterMultiChoice
          labelClear="Hreinsa"
          onChange={({ categoryId, selected }) =>
            onFiltersChange(categoryId as keyof CompanyFilters, [...selected])
          }
          onClear={(categoryId) =>
            onFiltersChange(categoryId as keyof CompanyFilters, [])
          }
          categories={categories}
        />
      </Filter>
    </>
  )
}
