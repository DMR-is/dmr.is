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
      sortable: true,
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
        sortingKey: 'casePublishDate',
        sortingValue: row.requestedPublicationDate,
        children: (
          <Text variant="medium">
            {formatDate(row.publishedAt || row.requestedPublicationDate)}
          </Text>
        ),
      },
      {
        children: <Text variant="medium">{row.status.title}</Text>, // TODO: Add publication number to case
      },
      {
        children: (
          <div className={styles.titleTableCell}>
            <Text truncate variant="medium">
              {row.advertType.title} {row.advertTitle}
            </Text>
          </div>
        ),
      },
      {
        children: (
          <div className={styles.typeTableCell}>
            <Text truncate variant="medium">
              {row.involvedParty.title}
            </Text>
          </div>
        ),
      },
    ],
  }))

  return (
    <CaseTable
      columns={columns}
      rows={rows}
      paging={paging}
      defaultSort={{ direction: 'desc', key: 'casePublishDate' }}
    />
  )
}
