'use client'

import debounce from 'lodash/debounce'
import { useCallback, useState } from 'react'
import useSWR from 'swr'

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

import { useClient } from '../../../../hooks/useClient'
import { useFilters } from '../../../../hooks/useFilters'
import { isDate } from '../../../../lib/utils'
export const SearchSidebar = () => {
  const client = useClient()
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

    setFilters({ ...filters, [key]: (date as Date).toISOString() })
  }

  const { data: typeData } = useSWR('getTypes', () => client.getTypes(), {
    dedupingInterval: 60000,
    refreshInterval: 0,
    revalidateOnFocus: false,
  })

  const { data: categoryData } = useSWR(
    ['getCategories', filters.typeId],
    ([_key, typeIds]) => client.getCategories({ type: typeIds }),
    {
      dedupingInterval: 60000,
      refreshInterval: 0,
      revalidateOnFocus: false,
    },
  )

  const typeOptions = typeData?.types.map((type) => ({
    label: type.title,
    value: type.id,
  }))

  const categoryOptions = categoryData?.categories.map((cat) => ({
    label: cat.title,
    value: cat.id,
  }))

  return (
    <Stack space={[1, 2]} key={timestamp}>
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
        isClearable
        label="Tegund"
        options={typeOptions || []}
        size="xs"
        defaultValue={
          filters.typeId
            ? { label: filters.typeId, value: filters.typeId }
            : null
        }
        onChange={(opt) => {
          if (!opt) {
            return setFilters({ ...filters, typeId: null, categoryId: [] })
          }
          setFilters({
            ...filters,
            typeId: opt.value as string,
            categoryId: [],
          })
        }}
      />
      <Select
        key={filters.typeId}
        noOptionsMessage="Veldu tegund fyrst"
        isMulti
        isClearable
        label="Flokkur"
        options={categoryOptions || []}
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
