import { Text } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { formatDate } from '../../lib/utils'
import { CaseTag } from '../case-tag/CaseTag'
import { CaseLabelTooltip } from '../tooltips/CaseLabelTooltip'
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
      name: 'caseRegistrationDate',
      sortable: true,
      size: 'tiny',
      children: formatMessage(
        messages.tables.inReview.columns.registrationDate,
      ),
    },
    {
      name: 'caseDepartment',
      sortable: true,
      size: 'tiny',
      children: formatMessage(messages.tables.inReview.columns.department),
    },
    {
      name: 'caseAdvertType',
      sortable: true,
      children: formatMessage(messages.tables.general.type),
    },
    {
      name: 'caseName',
      sortable: true,
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
      sortable: true,
      size: 'tiny',
      children: formatMessage(messages.tables.inReview.columns.tags),
    },
  ]

  const rows: CaseTableRowProps[] = data.map((row) => ({
    case: row,
    cells: [
      {
        children: row.fastTrack && (
          <div className={styles.iconWrapper}>
            {row.fastTrack && <CaseLabelTooltip label={'fasttrack'} />}
          </div>
        ),
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
        sortingKey: 'caseAdvertType',
        sortingValue: row.advertType.title,
        children: (
          <div className={styles.nameTableCell}>
            <Text truncate variant="medium">
              {row.advertType.title}
            </Text>
          </div>
        ),
      },
      {
        sortingKey: 'caseName',
        sortingValue: row.advertTitle,
        children: (
          <div className={styles.nameTableCell}>
            <Text truncate variant="medium">
              {row.advertTitle}
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
        sortingValue: row.tag.value,
        children: <CaseTag tag={row.tag.value} />,
      },
    ],
  }))

  return <CaseTable columns={columns} rows={rows} paging={paging} />
}
