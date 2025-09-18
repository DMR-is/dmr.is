'use client'

import debounce from 'lodash/debounce'
import { useCallback } from 'react'

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
import { isDate } from '../../../../lib/utils'

export const SearchSidebar = () => {
  const { filters, setFilters, reset } = useFilters()
  const MIN_DATE = new Date('1970-01-01')

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

    setFilters({ ...filters, [key]: (date as Date).toISOString() })
  }

  return (
    <Stack space={[1, 2]}>
      <Text variant="h4">Leit</Text>
      <Input
        placeholder="Leit í Lögbirtingablaðinu"
        name="search"
        size="sm"
        onChange={(e) => debouncedSetFilters('search', e.target.value)}
      />
      <Divider />
      <Inline justifyContent="spaceBetween" alignY="center">
        <Text variant="h4">Síur</Text>
        <Button variant="text" size="small" onClick={reset}>
          Hreinsa síur
        </Button>
      </Inline>
      <Select
        isMulti
        isClearable
        label="Tegund"
        options={[]}
        size="xs"
        defaultValue={filters.typeId.map((id) => ({ label: id, value: id }))}
        onChange={(options) => {
          const incoming = options.map((opt) => opt.value as string)
          setFilters({ ...filters, typeId: incoming })
        }}
      />
      <Select
        isMulti
        isClearable
        label="Flokkur"
        options={[]}
        size="xs"
        defaultValue={filters.categoryId.map((id) => ({
          label: id,
          value: id,
        }))}
        onChange={(options) => {
          const incoming = options.map((opt) => opt.value as string)
          setFilters({ ...filters, categoryId: incoming })
        }}
      />
      <DatePicker
        locale="is"
        label="Dagsetning frá"
        size="xs"
        placeholderText=""
        minDate={MIN_DATE}
        maxDate={new Date()}
        handleChange={(date) => updateDate('dateFrom', date)}
      />
      <DatePicker
        locale="is"
        label="Dagsetning til"
        size="xs"
        placeholderText=""
        minDate={filters.dateFrom ? new Date(filters.dateFrom) : MIN_DATE}
        maxDate={new Date()}
        handleChange={(date) => updateDate('dateTo', date)}
      />
    </Stack>
  )
}
