'use client'

import { Filter } from '@dmr.is/ui/components/island-is/Filter'
import { FilterInput } from '@dmr.is/ui/components/island-is/FilterInput'
import { FilterMultiChoice } from '@dmr.is/ui/components/island-is/FilterMultiChoice'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { useIsMobile } from '../../hooks/useIsMobile'
import { useIsTablet } from '../../hooks/useIsTablet'
import { companiesText, sharedText } from '../../lib/text'
import { EMPLOYEE_RANGES } from '../../lib/utils'
import {
  DAILY_FINES_FILTER_OPTIONS,
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
  singleOption?: boolean
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
  const { isMobile } = useIsMobile()
  const { isTablet } = useIsTablet()

  const categories: Category[] = [
    {
      id: 'employees',
      label: companiesText.avgEmployeeCount,
      selected: filters.employees,
      filters: EMPLOYEE_RANGES,
      singleOption: true,
    },
    {
      id: 'status',
      label: sharedText.statusLabel,
      selected: filters.status,
      filters: STATUS_FILTER_OPTIONS,
    },
    {
      id: 'expires',
      label: companiesText.validPeriod,
      selected: filters.expires,
      filters: EXPIRES_FILTER_OPTIONS,
    },
    {
      id: 'dailyFines',
      label: companiesText.dailyFines,
      selected: filters.dailyFines,
      filters: DAILY_FINES_FILTER_OPTIONS,
    },
  ]

  return (
    <>
      {!isMobile && (
        <Text variant="h5" fontWeight="semiBold" marginBottom={2}>
          {companiesText.filterHeading}
        </Text>
      )}
      <Filter
        labelClearAll={sharedText.filter.labelClearAll}
        labelOpen={sharedText.filter.labelOpen}
        labelClose={sharedText.filter.labelClose}
        labelClear={sharedText.filter.labelClear}
        labelTitle={sharedText.filter.labelTitle}
        labelResult={sharedText.filter.labelResult}
        onFilterClear={onReset}
        variant={isTablet ? 'popover' : 'default'}
        filterInput={
          <FilterInput
            name="query"
            placeholder={companiesText.filterPlaceholder}
            value={query}
            onChange={onQueryChange}
            backgroundColor="white"
          />
        }
      >
        <FilterMultiChoice
          labelClear={sharedText.filter.labelClear}
          onChange={({ categoryId, selected }) =>
            onFiltersChange(categoryId as keyof CompanyFilters, [...selected])
          }
          onClear={(categoryId) =>
            onFiltersChange(categoryId as keyof CompanyFilters, [])
          }
          singleExpand={false}
          categories={categories}
        />
      </Filter>
    </>
  )
}
