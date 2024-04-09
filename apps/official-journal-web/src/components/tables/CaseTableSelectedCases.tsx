import { Icon, Text } from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { CaseTable } from './CaseTable'
import { CaseTableSelectedCasesEmpty } from './CaseTableSelectedCasesEmpty'
import { messages } from './messages'

type Props = {
  data: Case[]
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
        case: row,
        cells: [
          {
            children: (
              <Text variant="medium" truncate>
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
