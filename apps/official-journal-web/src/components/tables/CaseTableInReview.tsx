import { Text } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { formatDate } from '../../lib/utils'
import { CaseTag } from '../case-tag/CaseTag'
import { CaseToolTips } from '../case-tooltips/CaseTooltips'
import {
  CaseTable,
  CaseTableHeadCellProps,
  CaseTableRowProps,
} from './CaseTable'
import * as styles from './CaseTable.css'
import { messages } from './messages'
import { TableProps } from './types'

export const CaseTableInReview = ({ data, paging }: TableProps) => {
  const { formatMessage } = useFormatMessage()

  const columns: CaseTableHeadCellProps[] = [
    {
      name: 'caseLabels',
      sortable: false,
      size: 'tiny',
    },
    {
      name: 'casePublishDate',
      sortable: true,
      size: 'tiny',
      children: formatMessage(messages.tables.inReview.columns.publishDate),
    },
    {
      name: 'caseDepartment',
      sortable: true,
      size: 'tiny',
      children: formatMessage(messages.tables.inReview.columns.department),
    },
    {
      name: 'caseTitle',
      sortable: false,
      children: formatMessage(messages.tables.inReview.columns.title),
    },
    {
      name: 'caseEmployee',
      sortable: true,
      size: 'tiny',
      children: formatMessage(messages.tables.inReview.columns.employee),
    },
    {
      name: 'caseTag',
      sortable: false,
      size: 'tiny',
      children: formatMessage(messages.tables.inReview.columns.tags),
    },
  ]

  const rows: CaseTableRowProps[] = data.map((row) => ({
    case: row,
    cells: [
      {
        children: <CaseToolTips case={row} />,
      },
      {
        sortingKey: 'casePublishDate',
        sortingValue: row.requestedPublicationDate,
        children: (
          <Text variant="medium">
            {formatDate(row.requestedPublicationDate)}
          </Text>
        ),
      },
      {
        sortingKey: 'caseDepartment',
        sortingValue: row.advertDepartment.title,
        children: (
          <Text truncate variant="medium">
            {row.advertDepartment.title}
          </Text>
        ),
      },
      {
        sortingKey: 'caseTitle',
        // sortingValue: row.advertTitle,
        children: (
          <div className={styles.titleTableCell} title={row.advertTitle}>
            <Text truncate variant="medium">
              {row.advertType.title} {row.advertTitle}
            </Text>
          </div>
        ),
      },
      {
        sortingKey: 'caseEmployee',
        sortingValue: row.assignedTo?.name,
        children: (
          <Text truncate variant="medium">
            {row.assignedTo?.name}
          </Text>
        ),
      },
      {
        sortingKey: 'caseTag',
        sortingValue: row.tag.title,
        children: <CaseTag tag={row.tag.title} />,
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
