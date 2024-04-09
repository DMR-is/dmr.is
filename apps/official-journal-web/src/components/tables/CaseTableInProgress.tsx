import { Text } from '@island.is/island-ui/core'

import { Paging } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { CaseTableItem, formatDate } from '../../lib/utils'
import { CaseLabelTooltip } from '../tooltips/CaseLabelTooltip'
import { CaseTable } from './CaseTable'
import * as styles from './CaseTable.css'
import { messages } from './messages'

type Props = {
  data: Array<CaseTableItem>
  paging: Paging
}
export const CaseTableInProgress = ({ data, paging }: Props) => {
  const { formatMessage } = useFormatMessage()

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
      children: formatMessage(messages.tables.inProgress.columns.publishDate),
    },
    {
      name: 'caseDepartment',
      sortable: true,
      small: true,
      children: formatMessage(messages.tables.inProgress.columns.department),
    },
    {
      name: 'caseName',
      sortable: true,
      small: false,
      children: formatMessage(messages.tables.inProgress.columns.title),
    },
    {
      name: 'caseEmployee',
      sortable: true,
      small: true,
      children: formatMessage(messages.tables.inProgress.columns.employee),
    },
  ]

  const rows = data.map((row) => ({
    caseId: row.id,
    status: row.status,
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

  return <CaseTable columns={columns} rows={rows} paging={paging} />
}
