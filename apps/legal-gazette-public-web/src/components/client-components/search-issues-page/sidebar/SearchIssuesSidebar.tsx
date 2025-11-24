'use client'

import { useState } from 'react'

import {
  Box,
  Button,
  DatePicker,
  Inline,
  Select,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { Icon } from '@island.is/island-ui/core'

import { useFilters } from '../../../../hooks/useFilters'
import { isDate } from '../../../../lib/utils'

export const SearchIssuesSidebar = ({
  totalItems,
}: {
  totalItems?: number
}) => {
  const { filters, setFilters, reset } = useFilters()
  const MIN_DATE = new Date('2000-01-01')
  const THIS_YEAR = new Date().getFullYear()
  const [timestamp, setTimestamp] = useState(new Date().getTime())
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  const updateDate = (key: keyof typeof filters, date: unknown) => {
    if (!isDate(date)) {
      return setFilters({ ...filters, [key]: null })
    }

    if (endDate) {
      setEndDate(date)
    }

    setFilters({ ...filters, [key]: date, page: 1 })
  }

  const totalResultsOptions = Array.from(
    { length: 5 },
    (_, i) => (i + 1) * 5,
  ).map((num) => ({
    label: num.toString(),
    value: num,
  }))

  const yearOptions = Array.from(
    { length: THIS_YEAR - 1999 },
    (_, i) => THIS_YEAR - i,
  ).map((num) => ({
    label: num.toString(),
    value: num,
  }))

  const defaultYear = yearOptions[0]

  return (
    <Stack space={2}>
      <Box padding={3} background="white" borderRadius="md">
        <Stack space={[1, 2]} key={timestamp}>
          <Inline justifyContent="spaceBetween" alignY="center">
            <Text variant="h4">Síur</Text>
            <Button
              variant="text"
              size="small"
              icon="reload"
              onClick={() => {
                reset()
                setStartDate(null)
                setEndDate(null)
                setTimestamp(new Date().getTime())
              }}
            >
              Hreinsa síur
            </Button>
          </Inline>
          <Select
            label="Ár"
            options={yearOptions}
            size="xs"
            backgroundColor="blue"
            defaultValue={
              filters.yearId
                ? yearOptions.find((o) => o.value === filters.yearId)
                : defaultYear
            }
            onChange={(opt) => {
              if (!opt) {
                return
              }
              setStartDate(
                new Date(
                  `${opt.value}-${new Date().getMonth() + 1}-${new Date().getDate()}`,
                ),
              )
              setEndDate(
                new Date(
                  `${opt.value}-${new Date().getMonth() + 1}-${new Date().getDate()}`,
                ),
              )

              setFilters((prev) => ({ ...prev, yearId: opt.value, page: null }))
            }}
          />

          <DatePicker
            locale="is"
            label="Dagsetning frá"
            size="xs"
            backgroundColor="blue"
            placeholderText=""
            selected={filters.dateFrom}
            minDate={startDate ?? MIN_DATE}
            maxDate={startDate ?? new Date()}
            handleChange={(date) => updateDate('dateFrom', date)}
            handleOpenCalendar={() => {
              if (startDate) {
                setStartDate(null)
              }
            }}
          />
          <DatePicker
            locale="is"
            label="Dagsetning til"
            size="xs"
            backgroundColor="blue"
            placeholderText=""
            selected={filters.dateTo}
            minDate={
              endDate ?? (filters.dateFrom ? filters.dateFrom : MIN_DATE)
            }
            maxDate={endDate ?? new Date()}
            handleChange={(date) => updateDate('dateTo', date)}
            handleOpenCalendar={() => {
              if (endDate) {
                setEndDate(null)
              }
            }}
          />
          <Select
            label="Fjöldi niðurstaða á síðu"
            options={totalResultsOptions}
            size="xs"
            backgroundColor="blue"
            defaultValue={totalResultsOptions.find(
              (o) => o.value === filters.pageSize,
            )}
            onChange={(opt) => {
              if (!opt) return
              setFilters({ ...filters, pageSize: opt.value, page: 1 })
            }}
          />
        </Stack>
      </Box>
      <Box paddingLeft={1} marginBottom={4}>
        {totalItems ? (
          <Text>
            <strong>
              {filters.page > 1 ? filters.pageSize * (filters.page - 1) + 1 : 1}
            </strong>
            {' – '}
            <strong>
              {filters.page * filters.pageSize < totalItems
                ? filters.page * filters.pageSize
                : totalItems}
            </strong>
            {' af '}
            <strong>{totalItems}</strong> niðurstöðum
          </Text>
        ) : null}
      </Box>
    </Stack>
  )
}
