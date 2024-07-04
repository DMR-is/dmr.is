import { AlertMessage, SkeletonLoader } from '@island.is/island-ui/core'

import { useDepartments } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages as errorMessages } from '../../lib/messages/errors'
import { generateOptions } from '../../lib/utils'
import { FilterGroup } from '../filter-group/FilterGroup'

export const DepartmentsFilter = () => {
  const { formatMessage } = useFormatMessage()
  const { data, error, isLoading } = useDepartments({
    options: {
      keepPreviousData: true,
    },
  })

  if (isLoading) {
    return <SkeletonLoader height={44} />
  }

  if (error) {
    return (
      <AlertMessage
        type="error"
        title={formatMessage(errorMessages.errorFetchingData)}
        message={formatMessage(errorMessages.errorFetchingDepartmentsMessage)}
      />
    )
  }

  if (!data) {
    return (
      <AlertMessage
        type="warning"
        title={formatMessage(errorMessages.noDataTitle)}
        message={formatMessage(errorMessages.noDataText)}
      />
    )
  }

  const options = generateOptions({
    label: 'Deild',
    queryKey: 'department',
    options: data.departments,
  })

  return <FilterGroup {...options} />
}
