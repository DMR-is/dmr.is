import { useFilters } from '@dmr.is/ui/hooks/useFilters'

import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'

import { useDepartments } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages as errorMessages } from '../../lib/messages/errors'
import { FilterGroup } from '../filter-group/FilterGroup'

export const DepartmentsFilter = () => {
    const { params, setParams } = useFilters()

  const { formatMessage } = useFormatMessage()
  const { departments, error, isLoading } = useDepartments({
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
        message={formatMessage(errorMessages.errorFetchingDepartmentsMessage)}
      />
    )
  }

  return (
    <FilterGroup
      label="Deild"
      filters={params.department}
      setFilters={(p) => setParams({ department: p })}
      options={departments ?? []}
      loading={isLoading}
    />
  )
}
