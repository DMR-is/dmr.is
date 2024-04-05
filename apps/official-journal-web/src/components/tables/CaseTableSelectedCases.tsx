import { Icon, Text } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { CaseTableItem } from '../../lib/utils'
import { CaseTable } from './CaseTable'
import { CaseTableSelectedCasesEmpty } from './CaseTableSelectedCasesEmpty'
import { messages } from './messages'

type Props = {
  data: CaseTableItem[]
}

export const CaseTableSelectedCases = ({ data }: Props) => {
  const { formatMessage } = useFormatMessage()

  if (!data.length) return <CaseTableSelectedCasesEmpty />

  return (
    <CaseTable
      renderLink={false}
      columns={[
        {
          name: 'caseNumber',
          fixed: true,
          small: true,
          children: formatMessage(messages.tables.selectedCases.columns.number),
        },
        {
          name: 'caseTitle',
          fixed: false,
          small: false,
          children: formatMessage(messages.tables.selectedCases.columns.title),
        },
        {
          name: 'caseInstitution',
          fixed: false,
          small: true,
          children: formatMessage(
            messages.tables.selectedCases.columns.institution,
          ),
        },
        {
          name: '',
          fixed: false,
          small: true,
          children: '',
        },
      ]}
      rows={data.map((row) => ({
        caseId: row.id,
        status: row.status,
        cells: [
          {
            children: (
              <Text variant="medium" truncate>
                {`${row.number}/${row.year}`}
              </Text>
            ),
          },
          {
            children: (
              <Text variant="medium" truncate>
                {row.title}
              </Text>
            ),
          },
          {
            children: (
              <Text variant="medium" truncate>
                {row.institution}
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
