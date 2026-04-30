'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Filter } from '@dmr.is/ui/components/island-is/Filter'
import { FilterInput } from '@dmr.is/ui/components/island-is/FilterInput'
import { FilterMultiChoice } from '@dmr.is/ui/components/island-is/FilterMultiChoice'
import { Text } from '@dmr.is/ui/components/island-is/Text'

export type CaseFilterState = {
  query?: string
  category?: string[]
  ceoGender?: string[]
}

type Props = {
  filterState: CaseFilterState
  onChange: (key: keyof CaseFilterState, values?: string[]) => void
  onQueryChange: (value: string) => void
  onReset: () => void
}

export const CaseFilter = ({
  filterState,
  onChange,
  onQueryChange,
  onReset,
}: Props) => {
  return (
    <Box>
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
            placeholder="Leita að máli..."
            value={filterState.query ?? ''}
            onChange={onQueryChange}
          />
        }
      >
        <FilterMultiChoice
          labelClear="Hreinsa"
          onChange={({ categoryId, selected }) => {
            onChange(
              categoryId as keyof CaseFilterState,
              selected.length ? selected : undefined,
            )
          }}
          onClear={(categoryId) => {
            onChange(categoryId as keyof CaseFilterState, undefined)
          }}
          categories={[
            {
              id: 'category',
              label: 'Flokkur',
              selected: filterState.category ?? [],
              filters: [
                { value: 'Jafnréttisáætlun', label: 'Jafnréttisáætlun' },
                { value: 'Úrbótaáætlun', label: 'Úrbótaáætlun' },
              ],
            },
            {
              id: 'ceoGender',
              label: 'Kyn æðsta stjórnanda',
              selected: filterState.ceoGender ?? [],
              filters: [
                { value: 'Karl', label: 'Karl' },
                { value: 'Kona', label: 'Kona' },
              ],
            },
          ]}
        />
      </Filter>
    </Box>
  )
}
