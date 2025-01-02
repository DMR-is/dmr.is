import { AlertMessage, SkeletonLoader } from '@island.is/island-ui/core'

import { useDepartments } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages as errorMessages } from '../../lib/messages/errors'
import { generateOptions } from '../../lib/utils'
import { FilterGroup } from '../filter-group/FilterGroup'

export const DepartmentsFilter = () => {
  const { formatMessage } = useFormatMessage()
  const { departments, error, isLoading } = useDepartments({
    options: {
      keepPreviousData: true,
      refreshInterval: 0,
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

  const options = generateOptions({
    label: 'Deild',
    queryKey: 'department',
    options: departments,
  })

  return <FilterGroup {...options} loading={isLoading} />
}
