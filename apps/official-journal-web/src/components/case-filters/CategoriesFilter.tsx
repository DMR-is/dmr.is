import { useState } from 'react'

import { AlertMessage } from '@island.is/island-ui/core'

import { useCategories } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages as errorMessages } from '../../lib/messages/errors'
import { messages as generalMessages } from '../../lib/messages/general'
import { generateOptions } from '../../lib/utils'
import { FilterGroup } from '../filter-group/FilterGroup'

export const CategoriesFilter = () => {
  const { formatMessage } = useFormatMessage()
  const [search, setSearch] = useState('')
  const { data, error, isLoading } = useCategories({
    params: { page: 1, pageSize: 1000, search },
    options: {
      keepPreviousData: true,
      refreshInterval: 0,
    },
  })

  if (error) {
    return (
      <AlertMessage
        type="error"
        title={formatMessage(errorMessages.errorFetchingData)}
        message={formatMessage(errorMessages.errorFetchingCategoriesMessage)}
      />
    )
  }

  if (!data && !isLoading) {
    return (
      <AlertMessage
        type="warning"
        title={formatMessage(errorMessages.noDataTitle)}
        message={formatMessage(errorMessages.noDataText)}
      />
    )
  }

  const options = generateOptions({
    label: 'Flokkur',
    queryKey: 'category',
    options: data?.categories,
  })

  return (
    <FilterGroup
      search={search}
      setSearch={setSearch}
      loading={isLoading}
      searchPlaceholder={formatMessage(generalMessages.searchByCategory)}
      {...options}
    />
  )
}
