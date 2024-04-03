import { Icon, Text } from '@island.is/island-ui/core'

import { CaseTable } from './CaseTable'
import { CaseReadyForPublishing } from './CaseTablePublishing'
import { CaseTableSelectedCasesEmpty } from './CaseTableSelectedCasesEmpty'

type Props = {
  data: CaseReadyForPublishing[]
}

export const CaseTableSelectedCases = ({ data }: Props) => {
  if (!data.length) return <CaseTableSelectedCasesEmpty />

  return (
    <CaseTable
      renderLink={false}
      columns={[
        {
          name: 'caseNumber',
          fixed: true,
          small: true,
          children: 'Númer',
        },
        {
          name: 'caseTitle',
          fixed: false,
          small: false,
          children: 'Heiti',
        },
        {
          name: 'caseInstitution',
          fixed: false,
          small: true,
          children: 'Stofnun',
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
        cells: [
          {
            children: (
              <Text variant="medium" truncate>
                {row.caseNumber}
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
