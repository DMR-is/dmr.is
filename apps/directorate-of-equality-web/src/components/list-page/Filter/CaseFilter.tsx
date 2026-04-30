'use client'

import { Accordion } from '@dmr.is/ui/components/island-is/Accordion'
import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { Filter } from '@dmr.is/ui/components/island-is/Filter'
import { FilterInput } from '@dmr.is/ui/components/island-is/FilterInput'
import { FilterMultiChoice } from '@dmr.is/ui/components/island-is/FilterMultiChoice'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import * as styles from './CaseFilter.css'

export type CaseFilterState = {
  query?: string
  category?: string[]
  status?: string[]
  employees?: string[]
  dateFrom?: Date
  dateTo?: Date
}

type Props = {
  filterState: CaseFilterState
  onChange: (key: keyof CaseFilterState, values?: string[]) => void
  onQueryChange: (value: string) => void
  onDateChange: (key: 'dateFrom' | 'dateTo', value?: Date) => void
  onReset: () => void
  showStatusFilter?: boolean
  showEmployeesFilter?: boolean
}

export const CaseFilter = ({
  filterState,
  onChange,
  onQueryChange,
  onDateChange,
  onReset,
  showStatusFilter,
  showEmployeesFilter,
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
            ...(showStatusFilter
              ? [
                  {
                    id: 'status',
                    label: 'Staða',
                    selected: filterState.status ?? [],
                    filters: [
                      { value: 'Í vinnslu', label: 'Í vinnslu' },
                      { value: 'Bíður gagna', label: 'Bíður gagna' },
                      { value: 'Til skoðunar', label: 'Til skoðunar' },
                      { value: 'Samþykkt', label: 'Samþykkt' },
                      { value: 'Hafnað', label: 'Hafnað' },
                      { value: 'Lokið', label: 'Lokið' },
                    ],
                  },
                ]
              : []),
            ...(showEmployeesFilter
              ? [
                  {
                    id: 'employees',
                    label: 'Starfsmenn',
                    selected: filterState.employees ?? [],
                    filters: [
                      { value: '1-25', label: '1–25' },
                      { value: '26-50', label: '26–50' },
                      { value: '51-100', label: '51–100' },
                      { value: '101+', label: '101+' },
                    ],
                  },
                ]
              : []),
          ]}
        />
        <Box className={styles.dateSection} paddingX={3} background={'white'}>
          <Box borderTopWidth="standard" borderColor="blue200" width="full" />
          <Box marginTop={1}>
            <Accordion
              dividerOnBottom={false}
              dividerOnTop={false}
              singleExpand={false}
            >
              <AccordionItem
                id="date-accordion-item"
                label="Tímabil"
                labelVariant="h5"
                iconVariant="small"
              >
                <Stack space={2}>
                  <DatePicker
                    label="Frá"
                    placeholderText="Frá"
                    size="xs"
                    selected={filterState.dateFrom}
                    maxDate={filterState.dateTo}
                    handleChange={(date) =>
                      onDateChange('dateFrom', date ?? undefined)
                    }
                    locale="is"
                    appearInline
                  />
                  <DatePicker
                    label="Til"
                    placeholderText="Til"
                    size="xs"
                    selected={filterState.dateTo}
                    minDate={filterState.dateFrom}
                    handleChange={(date) =>
                      onDateChange('dateTo', date ?? undefined)
                    }
                    locale="is"
                  />
                  {(filterState.dateFrom || filterState.dateTo) && (
                    <Box textAlign="right">
                      <Button
                        icon="reload"
                        size="small"
                        variant="text"
                        onClick={() => {
                          onDateChange('dateFrom', undefined)
                          onDateChange('dateTo', undefined)
                        }}
                      >
                        Hreinsa dagsetningar
                      </Button>
                    </Box>
                  )}
                </Stack>
              </AccordionItem>
            </Accordion>
          </Box>
        </Box>
      </Filter>
    </Box>
  )
}
