'use client'

import debounce from 'lodash/debounce'
import { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'
import useSWR from 'swr'

import { Inline, Input, Stack } from '@island.is/island-ui/core'

import { useClient } from '../../../hooks/useClient'
import { useFilters } from '../../../hooks/useFilters'
import { QueryParams } from '../../../lib/constants'
import { messages } from '../../../lib/messages/messages'
import FilterMenu from '../FilterMenu/FilterMenu'

export const CaseFilters = () => {
  const typeClient = useClient('TypeApi')
  const categoryClient = useClient('CategoryApi')

  const { params, setParams } = useFilters()
  const [localSearch, setLocalSearch] = useState(params.search)

  const { formatMessage } = useIntl()

  const handleSearch = useCallback(
    debounce((value: string) => {
      setParams({ search: value })
    }, 500),
    [],
  )

  const { data: typesData } = useSWR('getTypes', typeClient.getTypes, {
    refreshInterval: 0,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    keepPreviousData: true,
  })

  const { data: categoriesData } = useSWR(
    'getCategories',
    categoryClient.getCategories,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      keepPreviousData: true,
    },
  )

  const typeOptions = typesData?.types.map((type) => ({
    value: type.id,
    label: type.title,
  }))
  const categoryOptions = categoriesData?.categories.map((cat) => ({
    value: cat.id,
    label: cat.title,
  }))

  return (
    <Stack space={[1, 2]}>
      <Inline alignY="center" space={2}>
        <Input
          size="sm"
          name="search"
          placeholder={formatMessage(messages.search)}
          backgroundColor="blue"
          value={localSearch}
          onChange={(e) => {
            setLocalSearch(e.target.value)
            handleSearch(e.target.value)
          }}
        />
        <FilterMenu
          filters={[
            {
              title: 'Tegund',
              options: typeOptions,
              queryParam: QueryParams.TYPE,
            },
            {
              title: 'Flokkur',
              options: categoryOptions,
              queryParam: QueryParams.CATEGORY,
            },
          ]}
        />
      </Inline>
      <div>Active filters</div>
    </Stack>
  )
}

export default CaseFilters
