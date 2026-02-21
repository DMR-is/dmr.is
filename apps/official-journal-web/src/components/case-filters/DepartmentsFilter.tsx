'use client'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { useFilters } from '@dmr.is/ui/hooks/useFilters'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages as errorMessages } from '../../lib/messages/errors'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { FilterGroup } from '../filter-group/FilterGroup'

export const DepartmentsFilter = () => {
  const { params, setParams } = useFilters()

  const { formatMessage } = useFormatMessage()

  const trpc = useTRPC()
  const { data, error, isLoading } = useQuery(
    trpc.getDepartments.queryOptions({}),
  )

  if (error) {
    return (
      <AlertMessage
        type="error"
        title={formatMessage(errorMessages.errorFetchingData)}
        message={formatMessage(errorMessages.errorFetchingDepartmentsMessage)}
      />
    )
  }

  return (
    <FilterGroup
      label="Deild"
      filters={params.department}
      setFilters={(p) => setParams({ department: p })}
      options={data?.departments ?? []}
      loading={isLoading}
    />
  )
}
