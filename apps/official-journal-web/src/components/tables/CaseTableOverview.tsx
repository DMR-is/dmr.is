import { Text } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { formatDate } from '../../lib/utils'
import {
  CaseTable,
  CaseTableHeadCellProps,
  CaseTableRowProps,
} from './CaseTable'
import * as styles from './CaseTable.css'
import { messages } from './messages'
import { PublishedTableProps } from './types'

export const CaseTableOverview = ({ data, paging }: PublishedTableProps) => {
  const { formatMessage } = useFormatMessage()

  const columns: CaseTableHeadCellProps[] = [
    {
      name: 'casePublishDate',
      sortable: false,
      size: 'tiny',
      children: formatMessage(messages.tables.overview.columns.publishDate),
    },

    {
      name: 'caseStatus',
      sortable: false,
      size: 'tiny',
      children: formatMessage(messages.tables.overview.columns.status),
    },
    {
      name: 'caseTitle',
      sortable: false,
      children: formatMessage(messages.tables.overview.columns.title),
    },
    {
      name: 'caseInstitution',
      sortable: false,
      size: 'tiny',
      children: formatMessage(messages.tables.overview.columns.institution),
    },
  ]

  const rows: CaseTableRowProps[] = data.map((row) => ({
    case: row,
    cells: [
      {
        children: <Text variant="medium">{formatDate(row.publishDate)}</Text>,
      },
      {
        children: <Text variant="medium">{row.number}</Text>,
      },
      {
        children: (
          <div className={styles.nameTableCell}>
            <Text truncate variant="medium">
              {row.title}
            </Text>
          </div>
        ),
      },
      {
        children: (
          <Text truncate variant="medium">
            {row.institution}
          </Text>
        ),
      },
    ],
  }))

  return <CaseTable columns={columns} rows={rows} paging={paging} />
}
