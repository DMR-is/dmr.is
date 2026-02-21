'use client'

import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { useFilters } from '@dmr.is/ui/hooks/useFilters'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages as errorMessages } from '../../lib/messages/errors'
import { messages as generalMessages } from '../../lib/messages/general'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { FilterGroup } from '../filter-group/FilterGroup'

export const CategoriesFilter = () => {
  const { formatMessage } = useFormatMessage()
  const { params, setParams } = useFilters()
  const [search, setSearch] = useState('')

  const trpc = useTRPC()
  const { data, error, isLoading } = useQuery(
    trpc.getCategories.queryOptions({
      page: 1,
      pageSize: 1000,
      search: params.search ?? undefined,
    }),
  )

  if (error) {
    return (
      <AlertMessage
        type="error"
        title={formatMessage(errorMessages.errorFetchingData)}
        message={formatMessage(errorMessages.errorFetchingCategoriesMessage)}
      />
    )
  }

  return (
    <FilterGroup
      label="Flokkur"
      options={data?.categories ?? []}
      search={search}
      setSearch={setSearch}
      filters={params.category}
      setFilters={(p) => setParams({ category: p })}
      loading={isLoading}
      searchPlaceholder={formatMessage(generalMessages.searchByCategory)}
    />
  )
}
