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

import { overviewText, sharedText } from '../../../lib/text'
import * as styles from './ReportFilter.css'

export type FilterOption = { value: string; label: string }

type Props = {
  q: string | null
  type: string[] | null
  status: string[] | null
  statusOptions?: FilterOption[]
  reviewerUserId: string[] | null
  reviewers?: FilterOption[]
  onQChange: (value: string | null) => void
  onTypeChange: (values: string[] | null) => void
  onStatusChange: (values: string[] | null) => void
  onReviewerChange: (values: string[] | null) => void
  onReset: () => void
}

export const ReportFilter = ({
  q,
  type,
  status,
  statusOptions,
  reviewerUserId,
  reviewers,
  onQChange,
  onTypeChange,
  onStatusChange,
  onReviewerChange,
  onReset,
}: Props) => {
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()

  const handleReset = () => {
    setDateFrom(undefined)
    setDateTo(undefined)
    onReset()
  }

  const extraCategories = [
    ...(statusOptions && statusOptions.length > 0
      ? [
          {
            id: 'status',
            label: sharedText.statusLabel,
            selected: status ?? [],
            filters: statusOptions,
          },
        ]
      : []),
    ...(reviewers && reviewers.length > 0
      ? [
          {
            id: 'reviewer',
            label: overviewText.filter.reviewerLabel,
            selected: reviewerUserId ?? [],
            filters: reviewers,
          },
        ]
      : []),
  ]

  return (
    <Box>
      <Text variant="h5" fontWeight="semiBold" marginBottom={2}>
        {overviewText.filter.heading}
      </Text>
      <Filter
        labelClearAll={sharedText.filter.labelClearAll}
        labelOpen={sharedText.filter.labelOpen}
        labelClose={sharedText.filter.labelClose}
        labelClear={sharedText.filter.labelClear}
        labelTitle={sharedText.filter.labelTitle}
        labelResult={sharedText.filter.labelResult}
        onFilterClear={handleReset}
        variant="default"
        filterInput={
          <Box marginTop={3}>
            <FilterInput
              name="query"
              placeholder={overviewText.filter.placeholder}
              value={q ?? ''}
              onChange={(value) => onQChange(value || null)}
              backgroundColor="white"
            />
          </Box>
        }
      >
        <FilterMultiChoice
          labelClear={sharedText.filter.labelClear}
          onChange={({ categoryId, selected }) => {
            if (categoryId === 'type')
              onTypeChange(selected.length ? selected : null)
            if (categoryId === 'status')
              onStatusChange(selected.length ? selected : null)
            if (categoryId === 'reviewer')
              onReviewerChange(selected.length ? selected : null)
          }}
          onClear={(categoryId) => {
            if (categoryId === 'type') onTypeChange(null)
            if (categoryId === 'status') onStatusChange(null)
            if (categoryId === 'reviewer') onReviewerChange(null)
          }}
          categories={[
            {
              id: 'type',
              label: overviewText.filter.categoryLabel,
              selected: type ?? [],
              filters: [
                { value: 'EQUALITY', label: 'Jafnréttisáætlun' },
                { value: 'SALARY', label: 'Skýrslugjöf' },
              ],
            },
            ...extraCategories,
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
                label={overviewText.filter.dateRangeLabel}
                labelVariant="h5"
                iconVariant="small"
              >
                <Stack space={2}>
                  <DatePicker
                    label={overviewText.filter.dateFrom}
                    placeholderText={overviewText.filter.dateFrom}
                    size="xs"
                    selected={dateFrom}
                    maxDate={dateTo}
                    handleChange={(date) => setDateFrom(date ?? undefined)}
                    locale="is"
                    appearInline
                  />
                  <DatePicker
                    label={overviewText.filter.dateTo}
                    placeholderText={overviewText.filter.dateTo}
                    size="xs"
                    selected={dateTo}
                    minDate={dateFrom}
                    handleChange={(date) => setDateTo(date ?? undefined)}
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
                        {overviewText.filter.clearDates}
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
