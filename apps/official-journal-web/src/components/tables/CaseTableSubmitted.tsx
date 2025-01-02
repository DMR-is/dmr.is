import { Text } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { formatDate } from '../../lib/utils'
import { CaseToolTips } from '../case-tooltips/CaseTooltips'
import {
  CaseTable,
  CaseTableHeadCellProps,
  CaseTableRowProps,
} from './CaseTable'
import * as styles from './CaseTable.css'
import { messages } from './messages'
import { TableProps } from './types'

export const CaseTableSubmitted = ({ cases, paging }: TableProps) => {
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
      children: formatMessage(
        messages.tables.submitted.columns.publicationDate,
      ),
    },
    {
      name: 'caseRegistrationDate',
      sortable: true,
      size: 'tiny',
      children: formatMessage(
        messages.tables.submitted.columns.registrationDate,
      ),
    },
    {
      name: 'caseDepartment',
      sortable: true,
      size: 'tiny',
      children: formatMessage(messages.tables.submitted.columns.department),
    },
    {
      name: 'caseTitle',
      sortable: false,
      children: formatMessage(messages.tables.submitted.columns.title),
    },
  ]

  const rows: CaseTableRowProps[] = cases.map((row) => {
    return {
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
          sortingKey: 'caseRegistrationDate',
          sortingValue: row.createdAt,
          children: <Text variant="medium">{formatDate(row.createdAt)}</Text>,
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
          sortingValue: row.advertTitle,
          children: (
            <div className={styles.titleTableCell} title={row.advertTitle}>
              <Text truncate variant="medium">
                {row.advertType.title} {row.advertTitle}
              </Text>
            </div>
          ),
        },
      ],
    }
  })

  return (
    <CaseTable
      paging={paging}
      columns={columns}
      rows={rows}
      defaultSort={{ direction: 'asc', key: 'casePublishDate' }}
    />
  )
}
