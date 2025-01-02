import { useState } from 'react'

import { AlertMessage } from '@island.is/island-ui/core'

import { useAdvertTypes } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages as errorMessages } from '../../lib/messages/errors'
import { messages as generalMessages } from '../../lib/messages/general'
import { generateOptions } from '../../lib/utils'
import { FilterGroup } from '../filter-group/FilterGroup'

export const TypesFilter = () => {
  const { formatMessage } = useFormatMessage()
  const [search, setSearch] = useState('')

  const { types, isLoadingTypes, typesError } = useAdvertTypes({
    typesParams: {
      search,
    },
  })

  if (typesError) {
    return (
      <AlertMessage
        type="error"
        title={formatMessage(errorMessages.errorFetchingData)}
        message={formatMessage(errorMessages.errorFetchingTypesMessage)}
      />
    )
  }

  const options = generateOptions({
    label: 'Tegund',
    queryKey: 'type',
    options: types,
  })

  return (
    <FilterGroup
      search={search}
      setSearch={setSearch}
      loading={isLoadingTypes}
      searchPlaceholder={formatMessage(generalMessages.searchByType)}
      {...options}
    />
  )
}
