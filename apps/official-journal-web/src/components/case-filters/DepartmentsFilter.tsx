import { AlertMessage } from '@island.is/island-ui/core'

import { useDepartments } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages as errorMessages } from '../../lib/messages/errors'
import { FilterGroup } from '../filter-group/FilterGroup'

export const DepartmentsFilter = () => {
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
      queryKey="department"
      options={
        departments?.map((dep) => ({
          label: dep.title,
          value: dep.title,
        })) ?? []
      }
      loading={isLoading}
    />
  )
}
