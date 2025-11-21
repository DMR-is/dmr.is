'use client'

import debounce from 'lodash/debounce'
import { useCallback, useState } from 'react'

import {
  Button,
  DatePicker,
  Divider,
  Inline,
  Input,
  Select,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { useFilters } from '../../../../hooks/useFilters'
import { useTRPC } from '../../../../lib/trpc/client/trpc'
import { isDate } from '../../../../lib/utils'

import { useQuery } from '@tanstack/react-query'
export const SearchIssuesSidebar = () => {
  const trpc = useTRPC()
  const { filters, setFilters, reset } = useFilters()
  const MIN_DATE = new Date('1970-01-01')
  const [timestamp, setTimestamp] = useState(new Date().getTime())

  const debouncedSetFilters = useCallback(
    debounce(
      (key: keyof typeof filters, value: (typeof filters)[typeof key]) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
      },
      300,
    ),
    [setFilters],
  )

  const updateDate = (key: keyof typeof filters, date: unknown) => {
    if (!isDate(date)) {
      return setFilters({ ...filters, [key]: null })
    }

    setFilters({ ...filters, [key]: date })
  }

  const { data: categoryData, isPaused: isLoadingCategories } = useQuery(
    trpc.getCategories.queryOptions(
      { type: filters.typeId ?? undefined },
      { enabled: !!filters.typeId },
    ),
  )

  const yearOptions = [
    {
      label: '2025',
      value: 20025,
    },
    {
      label: '2024',
      value: 2024,
    },
    {
      label: '2023',
      value: 2023,
    },
    {
      label: '2022',
      value: 2022,
    },
    {
      label: '2021',
      value: 2021,
    },
  ]

  const defaultYear = yearOptions[0]

  const totalResultsOptions = Array.from(
    { length: 5 },
    (_, i) => (i + 1) * 5,
  ).map((num) => ({
    label: num.toString(),
    value: num,
  }))

  return (
    <Stack space={[1, 2]} key={timestamp}>
      <Inline justifyContent="spaceBetween" alignY="center">
        <Text variant="h4">Síur</Text>
        <Button
          variant="text"
          size="small"
          onClick={() => {
            reset()
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
        defaultValue={defaultYear}
        onChange={(opt) => {
          if (!opt) {
            return setFilters({ ...filters, typeId: null, categoryId: [] })
          }
          setFilters({
            ...filters,
            typeId: opt.value.toString(),
            categoryId: [],
          })
        }}
      />

      <DatePicker
        locale="is"
        label="Dagsetning frá"
        size="xs"
        placeholderText=""
        selected={filters.dateFrom}
        minDate={MIN_DATE}
        maxDate={new Date()}
        handleChange={(date) => updateDate('dateFrom', date)}
      />
      <DatePicker
        locale="is"
        label="Dagsetning til"
        size="xs"
        placeholderText=""
        selected={filters.dateTo}
        minDate={filters.dateFrom ? filters.dateFrom : MIN_DATE}
        maxDate={new Date()}
        handleChange={(date) => updateDate('dateTo', date)}
      />
      <Select
        label="Fjöldi niðurstaða á síðu"
        options={totalResultsOptions}
        size="xs"
        defaultValue={totalResultsOptions.find(
          (o) => o.value === filters.pageSize,
        )}
        onChange={(opt) => {
          if (!opt) return
          setFilters({ ...filters, pageSize: opt.value as number })
        }}
      />
    </Stack>
  )
}
