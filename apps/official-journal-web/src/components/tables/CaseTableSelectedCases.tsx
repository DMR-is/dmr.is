import { AlertMessage, SkeletonLoader } from '@island.is/island-ui/core'

import { useCases } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { usePublishContext } from '../../hooks/usePublishContext'
import { messages as errorMessages } from '../../lib/messages/errors'
import { CasePublishingTable } from './CasePublishingTable'
import { CaseTableHeadCellProps } from './CaseTable'
import { CaseTableSelectedCasesEmpty } from './CaseTableSelectedCasesEmpty'
import { messages } from './messages'

export const CaseTableSelectedCases = () => {
  const { formatMessage } = useFormatMessage()

  const { publishingState } = usePublishContext()
  const { selectedCaseIds } = publishingState

  const { data, error, isLoading } = useCases({
    params: {
      id: selectedCaseIds.join(','),
    },
  })

  if (isLoading) return <SkeletonLoader repeat={3} height={44} />

  if (error)
    return (
      <AlertMessage
        type="error"
        title={formatMessage(errorMessages.errorFetchingData)}
        message={formatMessage(errorMessages.errorFetchingCategoriesMessage)}
      />
    )

  const columns: CaseTableHeadCellProps[] = [
    {
      name: 'caseNumber',
      fixed: true,
      size: 'small',
      children: formatMessage(messages.tables.selectedCases.columns.number),
    },
    {
      name: 'caseType',
      fixed: false,
      children: formatMessage(messages.tables.selectedCases.columns.type),
    },
    {
      name: 'caseTitle',
      fixed: false,
      children: formatMessage(messages.tables.selectedCases.columns.title),
    },
    {
      name: 'caseInstitution',
      fixed: false,
      children: formatMessage(
        messages.tables.selectedCases.columns.institution,
      ),
    },
    {
      name: '',
      fixed: false,
      size: 'tiny',
      children: '',
    },
  ]

  if (!data?.cases.length || !selectedCaseIds.length)
    return <CaseTableSelectedCasesEmpty columns={columns} />

  return <CasePublishingTable columns={columns} rows={data.cases} />
}
