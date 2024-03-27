import { messages } from '../../lib/messages'
import { formatDate } from '../../lib/utils'
import { CaseLabelTooltip } from '../tooltips/CaseLabelTooltip'
import { CaseTable } from './CaseTable'
import { Text } from '@island.is/island-ui/core'
import * as styles from './CaseTable.css'
import { MockCasesType } from '../../screens/mock'

type Props = {
  data: MockCasesType['items']
}

export const CaseTableInProgress = ({ data }: Props) => {
  const columns = [
    {
      name: 'caseLabels',
      sortable: false,
      small: true,
    },
    {
      name: 'casePublishDate',
      sortable: true,
      small: true,
      children:
        messages.components.tables.caseOverview.headCells.publicationDate,
    },
    {
      name: 'caseRegistrationDate',
      sortable: true,
      small: true,
      children:
        messages.components.tables.caseOverview.headCells.registrationDate,
    },
    {
      name: 'caseDepartment',
      sortable: true,
      small: true,
      children: messages.components.tables.caseOverview.headCells.department,
    },
    {
      name: 'caseName',
      sortable: true,
      small: false,
      children: messages.components.tables.caseOverview.headCells.title,
    },
    {
      name: 'caseEmployee',
      sortable: true,
      small: false,
      children: messages.components.tables.caseOverview.headCells.employee,
    },
  ]

  const rows = data.map((row) => ({
    caseId: row.id,
    cells: [
      {
        children: row.labels.length > 0 && (
          <div className={styles.iconWrapper}>
            {row.labels.map((label, index) => (
              <CaseLabelTooltip label={label} key={index} />
            ))}
          </div>
        ),
      },
      {
        sortingKey: 'casePublishDate',
        sortingValue: row.publicationDate,
        children: (
          <Text variant="medium">{formatDate(row.publicationDate)}</Text>
        ),
      },
      {
        sortingKey: 'caseRegistrationDate',
        sortingValue: row.registrationDate,
        children: (
          <Text variant="medium">{formatDate(row.registrationDate)}</Text>
        ),
      },
      {
        sortingKey: 'caseDepartment',
        sortingValue: row.department,
        children: (
          <Text truncate variant="medium">
            {row.department}
          </Text>
        ),
      },
      {
        sortingKey: 'caseName',
        sortingValue: row.title,
        children: (
          <div className={styles.nameTableCell}>
            <Text truncate variant="medium">
              {row.title}
            </Text>
          </div>
        ),
      },
      {
        sortingKey: 'caseEmployee',
        sortingValue: row.employee,
        children: (
          <Text truncate variant="medium">
            {row.employee}
          </Text>
        ),
      },
    ],
  }))

  return (
    <CaseTable
      columns={columns}
      rows={rows}
      paging={{
        page: 1,
        totalPages: 2,
        totalItems: 11,
      }}
    />
  )
}
