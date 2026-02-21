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

export const TypesFilter = () => {
  const { formatMessage } = useFormatMessage()
  const [search, setSearch] = useState('')

  const { params, setParams } = useFilters()

  const trpc = useTRPC()
  const {
    data,
    isLoading: isLoadingTypes,
    error: typesError,
  } = useQuery(trpc.getTypes.queryOptions({ search }))

  if (typesError) {
    return (
      <AlertMessage
        type="error"
        title={formatMessage(errorMessages.errorFetchingData)}
        message={formatMessage(errorMessages.errorFetchingTypesMessage)}
      />
    )
  }

  return (
    <FilterGroup
      search={search}
      setSearch={setSearch}
      options={data?.types ?? []}
      label="Tegund"
      filters={params.type}
      setFilters={(p) => setParams({ type: p })}
      loading={isLoadingTypes}
      searchPlaceholder={formatMessage(generalMessages.searchByType)}
    />
  )
}
