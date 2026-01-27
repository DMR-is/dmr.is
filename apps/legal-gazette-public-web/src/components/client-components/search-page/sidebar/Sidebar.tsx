'use client'

import debounce from 'lodash/debounce'
import { useCallback, useEffect, useState } from 'react'

import {
  Box,
  Button,
  DatePicker,
  Divider,
  Inline,
  Input,
  Select,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'
import { PagingTotalItemsText } from '@dmr.is/ui/components/PagingTotaItemsText/PagingTotalItemsText'

import { Option } from '@island.is/island-ui/core'

import { useFilters } from '../../../../hooks/useFilters'
import { usePublications } from '../../../../hooks/usePublications'
import { useTRPC } from '../../../../lib/trpc/client/trpc'
import { isDate } from '../../../../lib/utils'

import { useQuery } from '@tanstack/react-query'

export const SearchSidebar = () => {
  const trpc = useTRPC()
  const { filters, setFilters, reset } = useFilters()
  const { totalItems } = usePublications()

  const THIS_YEAR = new Date().getFullYear()
  const MIN_DATE = new Date('2000-01-01')
  const MIN_YEAR = MIN_DATE.getFullYear()
  const [timestamp, setTimestamp] = useState(new Date().getTime())
  const [categorySelected, setCategorySelected] =
    useState<Option<string> | null>(null)
  const [typeSelected, setTypeSelected] = useState<Option<string> | null>(null)

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

  const { data: typeData, isLoading: isLoadingTypes } = useQuery(
    trpc.getTypes.queryOptions({
      category: filters.categoryId?.length ? filters.categoryId[0] : undefined,
    }),
  )

  const { data: categoryData, isLoading: isLoadingCategories } = useQuery(
    trpc.getCategories.queryOptions(),
  )

  const typeOptions = typeData?.types.map((type) => ({
    label: type.title,
    value: type.id,
  }))

  useEffect(() => {
    const filterCategory = filters.categoryId?.length
      ? categoryOptions?.find((cat) => cat.value === filters.categoryId?.[0])
      : null

    setCategorySelected(filterCategory || null)
  }, [categoryData, filters.categoryId])

  useEffect(() => {
    const filterType = typeOptions?.find(
      (type) => type.value === filters.typeId,
    )
    setTypeSelected(filterType || null)
  }, [typeData, filters.typeId])

  const categoryOptions = categoryData?.categories.map((cat) => ({
    label: cat.title,
    value: cat.id,
  }))

  const totalResultsOptions = Array.from(
    { length: 5 },
    (_, i) => (i + 1) * 5,
  ).map((num) => ({
    label: num.toString(),
    value: num,
  }))

  return (
    <Stack space={2}>
      <Box padding={3} borderRadius="large" background="blue100">
        <Stack space={[1, 2]} key={timestamp}>
          <Inline justifyContent={'spaceBetween'} alignY="center">
            <Text variant="h4">Leit</Text>
            <Button
              variant="text"
              size="small"
              icon="reload"
              onClick={() => {
                reset()
                setTimestamp(new Date().getTime())
              }}
            >
              Hreinsa
            </Button>
          </Inline>
          <Input
            placeholder="Sláðu inn leitarorð"
            name="search"
            size="sm"
            defaultValue={filters.search || ''}
            onChange={(e) => debouncedSetFilters('search', e.target.value)}
          />
          <Divider />
          <Select
            isLoading={isLoadingCategories}
            isClearable
            label="Flokkur"
            placeholder="Allir flokkar"
            options={categoryOptions || []}
            value={categorySelected}
            size="xs"
            onChange={(options) => {
              setFilters({
                ...filters,
                page: null,
                typeId: null,
                categoryId: options?.value ? [options.value] : null,
              })
            }}
          />

          <Select
            isClearable
            isLoading={isLoadingTypes}
            label="Tegund"
            placeholder="Allar tegundir"
            options={typeOptions || []}
            size="xs"
            value={typeSelected}
            onChange={(opt) => {
              setFilters({
                ...filters,
                page: null,
                typeId: opt?.value || null,
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
            minYear={MIN_YEAR}
            maxYear={THIS_YEAR}
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
            minYear={MIN_YEAR}
            maxYear={THIS_YEAR}
          />
          <Select
            label="Fjöldi niðurstaða"
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
      </Box>
      <Box paddingLeft={1} marginBottom={4}>
        <PagingTotalItemsText paging={filters} totalItems={totalItems} />
      </Box>
    </Stack>
  )
}
