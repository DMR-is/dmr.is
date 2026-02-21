import { useSession } from 'next-auth/react'

import { useState } from 'react'
import useSWR from 'swr'

import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { useFilters } from '@dmr.is/ui/hooks/useFilters'

import { GetAdvertTypes } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { getDmrClient } from '../../lib/api/createClient'
import { OJOIWebException, swrFetcher } from '../../lib/constants-legacy'
import { messages as errorMessages } from '../../lib/messages/errors'
import { messages as generalMessages } from '../../lib/messages/general'
import { FilterGroup } from '../filter-group/FilterGroup'

export const TypesFilter = () => {
  const { formatMessage } = useFormatMessage()
  const [search, setSearch] = useState('')

  const { params, setParams } = useFilters()

  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.idToken as string)

  const {
    data,
    isLoading: isLoadingTypes,
    error: typesError,
  } = useSWR<GetAdvertTypes, OJOIWebException>(
    session ? ['getAdvertTypes', search] : null,
    ([_key, search]: [string, string]) =>
      swrFetcher({
        func: () =>
          dmrClient.getTypes({
            search: search,
          }),
      }),

    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      refreshInterval: 0,
    },
  )

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
