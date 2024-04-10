import { Icon, Text } from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { CaseTable, CaseTableHeadCellProps } from './CaseTable'
import { CaseTableSelectedCasesEmpty } from './CaseTableSelectedCasesEmpty'
import { messages } from './messages'

type Props = {
  data: Case[]
}

export const CaseTableSelectedCases = ({ data }: Props) => {
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
    <CaseTable
      renderLink={false}
      columns={columns}
      rows={data.map((row) => ({
        case: row,
        cells: [
          {
            children: (
              <Text variant="medium" whiteSpace="nowrap">
                {`${row.caseNumber}/${row.year}`}
              </Text>
            ),
          },
          {
            children: (
              <Text variant="medium" truncate>
                {row.advert.title}
              </Text>
            ),
          },
          {
            children: (
              <Text variant="medium" truncate>
                {row.advert.involvedParty.title}
              </Text>
            ),
          },
          {
            children: (
              <button>
                <Icon icon="menu" color="blue400" />
              </button>
            ),
          },
        ],
      }))}
    />
  )
}
