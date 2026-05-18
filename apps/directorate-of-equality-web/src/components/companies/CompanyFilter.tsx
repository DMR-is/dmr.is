'use client'

import { Filter } from '@dmr.is/ui/components/island-is/Filter'
import { FilterInput } from '@dmr.is/ui/components/island-is/FilterInput'
import { FilterMultiChoice } from '@dmr.is/ui/components/island-is/FilterMultiChoice'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import {
  DAGSEKTIR_FILTER_OPTIONS,
  EMPLOYEE_RANGES,
  EXPIRES_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from './companyStatus'

type Props = {
  query: string
  employeeRanges: string[]
  statusFilters: string[]
  expiresFilter: string[]
  dagsektirFilter: string[]
  onQueryChange: (val: string) => void
  onEmployeeRangesChange: (val: string[]) => void
  onStatusFiltersChange: (val: string[]) => void
  onExpiresFilterChange: (val: string[]) => void
  onDagsektirFilterChange: (val: string[]) => void
  onReset: () => void
}

export const CompanyFilter = ({
  query,
  employeeRanges,
  statusFilters,
  expiresFilter,
  dagsektirFilter,
  onQueryChange,
  onEmployeeRangesChange,
  onStatusFiltersChange,
  onExpiresFilterChange,
  onDagsektirFilterChange,
  onReset,
}: Props) => (
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
        onChange={({ categoryId, selected }) => {
          if (categoryId === 'employees') onEmployeeRangesChange([...selected])
          if (categoryId === 'status') onStatusFiltersChange([...selected])
          if (categoryId === 'expires') onExpiresFilterChange([...selected])
          if (categoryId === 'dagsektir') onDagsektirFilterChange([...selected])
        }}
        onClear={(categoryId) => {
          if (categoryId === 'employees') onEmployeeRangesChange([])
          if (categoryId === 'status') onStatusFiltersChange([])
          if (categoryId === 'expires') onExpiresFilterChange([])
          if (categoryId === 'dagsektir') onDagsektirFilterChange([])
        }}
        categories={[
          {
            id: 'employees',
            label: 'Fjöldi starfsmanna',
            selected: employeeRanges,
            filters: EMPLOYEE_RANGES,
          },
          {
            id: 'status',
            label: 'Staða',
            selected: statusFilters,
            filters: STATUS_FILTER_OPTIONS,
          },
          {
            id: 'expires',
            label: 'Gildistími',
            selected: expiresFilter,
            filters: EXPIRES_FILTER_OPTIONS,
          },
          {
            id: 'dagsektir',
            label: 'Dagsektir',
            selected: dagsektirFilter,
            filters: DAGSEKTIR_FILTER_OPTIONS,
          },
        ]}
      />
    </Filter>
  </>
)
