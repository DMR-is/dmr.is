import { Case } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { CasePublishingTable } from './CasePublishingTable'
import { CaseTableHeadCellProps } from './CaseTable'
import { CaseTableSelectedCasesEmpty } from './CaseTableSelectedCasesEmpty'
import { messages } from './messages'

type Props = {
  data: Case[]
  setCasesReadyForPublication: React.Dispatch<React.SetStateAction<Case[]>>
}

export const CaseTableSelectedCases = ({
  data,
  setCasesReadyForPublication,
}: Props) => {
  const { formatMessage } = useFormatMessage()

  const columns: CaseTableHeadCellProps[] = [
    {
      name: 'caseNumber',
      fixed: true,
      size: 'small',
      children: formatMessage(messages.tables.selectedCases.columns.number),
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

  if (!data.length) return <CaseTableSelectedCasesEmpty columns={columns} />

  return (
    <CasePublishingTable
      updateRows={setCasesReadyForPublication}
      columns={columns}
      rows={data}
    />
  )
}
