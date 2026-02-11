'use client'

import { useEffect, useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { PagingTotalItemsText } from '@dmr.is/ui/components/PagingTotaItemsText/PagingTotalItemsText'

import { useFilters } from '../../../../hooks/useFilters'
import { useIssues } from '../../../../hooks/useIssues'
import { isDate } from '../../../../lib/utils'

export const SearchIssuesSidebar = () => {
  const { filters, setFilters, reset } = useFilters()
  const { totalItems } = useIssues()

  const THIS_YEAR = new Date().getFullYear()
  const MIN_DATE = new Date('2000-01-01')
  const MIN_YEAR = MIN_DATE.getFullYear()
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
    value: num.toString(),
  }))
  yearOptions.unshift({ label: '— Öll ár —', value: 'allt' })

  useEffect(() => {
    if (filters.dateFrom && filters.dateTo) {
      if (filters.dateFrom && filters.dateTo) {
        setFilters({ ...filters, year: 'all' })
      }
    }
  }, [filters.dateFrom, filters.dateTo])

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
            placeholder="Öll ár"
            size="xs"
            backgroundColor="blue"
            value={yearOptions.find((o) => o.value === filters.year) ?? null}
            onChange={(opt) => {
              if (!opt) {
                return
              }

              if (opt.value === 'allt') {
                setFilters((prev) => ({
                  ...prev,
                  year: 'all',
                  page: null,
                }))
                setStartDate(null)
                setEndDate(null)
                return
              }

              setFilters((prev) => ({
                ...prev,
                year: opt.value,
                page: null,
              }))

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
            minYear={MIN_YEAR}
            maxYear={THIS_YEAR}
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
            minYear={MIN_YEAR}
            maxYear={THIS_YEAR}
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
        <PagingTotalItemsText paging={filters} totalItems={totalItems} />
      </Box>
    </Stack>
  )
}
