'use client'

import { useState } from 'react'

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

import * as styles from './ReportFilter.css'

type Props = {
  q: string | null
  type: string[] | null
  status: string[] | null
  showStatusFilter?: boolean
  onQChange: (value: string | null) => void
  onTypeChange: (values: string[] | null) => void
  onStatusChange: (values: string[] | null) => void
  onReset: () => void
}

export const ReportFilter = ({
  q,
  type,
  status,
  showStatusFilter,
  onQChange,
  onTypeChange,
  onStatusChange,
  onReset,
}: Props) => {
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()

  const handleReset = () => {
    setDateFrom(undefined)
    setDateTo(undefined)
    onReset()
  }

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
        onFilterClear={handleReset}
        variant="default"
        filterInput={
          <FilterInput
            name="query"
            placeholder="Leita að máli..."
            value={q ?? ''}
            onChange={(value) => onQChange(value || null)}
            backgroundColor="white"
          />
        }
      >
        <FilterMultiChoice
          labelClear="Hreinsa"
          onChange={({ categoryId, selected }) => {
            if (categoryId === 'type')
              onTypeChange(selected.length ? selected : null)
            if (categoryId === 'status')
              onStatusChange(selected.length ? selected : null)
          }}
          onClear={(categoryId) => {
            if (categoryId === 'type') onTypeChange(null)
            if (categoryId === 'status') onStatusChange(null)
          }}
          categories={[
            {
              id: 'type',
              label: 'Flokkur',
              selected: type ?? [],
              filters: [
                { value: 'EQUALITY', label: 'Jafnréttisáætlun' },
                { value: 'SALARY', label: 'Launagreining' },
              ],
            },
            ...(showStatusFilter
              ? [
                  {
                    id: 'status',
                    label: 'Staða',
                    selected: status ?? [],
                    filters: [
                      { value: 'DRAFT', label: 'Drög' },
                      { value: 'SUBMITTED', label: 'Innsent' },
                      { value: 'IN_REVIEW', label: 'Í vinnslu' },
                      { value: 'APPROVED', label: 'Samþykkt' },
                      { value: 'DENIED', label: 'Hafnað' },
                      { value: 'SUPERSEDED', label: 'Úrelt' },
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
                    selected={dateFrom}
                    maxDate={dateTo}
                    handleChange={(date) => setDateFrom(date ?? undefined)}
                    locale="is"
                    appearInline
                  />
                  <DatePicker
                    label="Til"
                    placeholderText="Til"
                    size="xs"
                    selected={dateTo}
                    minDate={dateFrom}
                    handleChange={(date) => setDateTo(date ?? undefined)}
                    locale="is"
                  />
                  {(dateFrom || dateTo) && (
                    <Box textAlign="right">
                      <Button
                        icon="reload"
                        size="small"
                        variant="text"
                        onClick={() => {
                          setDateFrom(undefined)
                          setDateTo(undefined)
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
