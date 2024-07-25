import { useFormatMessage } from '../../hooks/useFormatMessage'
import { usePublishContext } from '../../hooks/usePublishContext'
import { CasePublishingTable } from './CasePublishingTable'
import { CaseTableHeadCellProps } from './CaseTable'
import { CaseTableSelectedCasesEmpty } from './CaseTableSelectedCasesEmpty'
import { messages } from './messages'

export const CaseTableSelectedCases = () => {
  const { formatMessage } = useFormatMessage()

  const { publishingState } = usePublishContext()
  const { selectedCaseIds } = publishingState

  const columns: CaseTableHeadCellProps[] = [
    {
      name: 'caseNumber',
      sortable: true,
      fixed: true,
      size: 'small',
      children: formatMessage(messages.tables.selectedCases.columns.number),
    },
    {
      name: 'caseType',
      sortable: false,
      fixed: false,
      children: formatMessage(messages.tables.selectedCases.columns.type),
    },
    {
      name: 'caseTitle',
      sortable: false,
      fixed: false,
      children: formatMessage(messages.tables.selectedCases.columns.title),
    },
    {
      name: 'caseInstitution',
      sortable: false,
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

  if (!selectedCaseIds.length)
    return <CaseTableSelectedCasesEmpty columns={columns} />

  return <CasePublishingTable columns={columns} />
}
