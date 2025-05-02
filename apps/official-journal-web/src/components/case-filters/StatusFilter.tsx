import { useState } from 'react'
import { useFilters } from '@dmr.is/ui/hooks/useFilters'

import { CaseStatusEnum } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages as generalMessages } from '../../lib/messages/general'
import { FilterGroup } from '../filter-group/FilterGroup'

type StatusFilterProps = {
  statuses: CaseStatusEnum[]
}

export const StatusFilter = ({ statuses }: StatusFilterProps) => {
  const { formatMessage } = useFormatMessage()
  const { params, setParams } = useFilters()
  const [search, setSearch] = useState('')

  return (
    <FilterGroup
      label="Staða"
      options={statuses.map((status) => ({
        title: status,
      }))}
      search={search}
      setSearch={setSearch}
      filters={params.status}
      setFilters={(p) => setParams({ status: p })}
      searchPlaceholder={formatMessage(generalMessages.searchByCategory)}
    />
  )
}
