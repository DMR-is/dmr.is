import dynamic from 'next/dynamic'

import { SkeletonLoader, Text } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { formatDate } from '../../lib/utils'
import { CaseToolTips } from '../case-tooltips/CaseTooltips'
import { CaseTableHeadCellProps } from './CaseTable'
import * as styles from './CaseTable.css'
import { messages } from './messages'
import { TableProps } from './types'

const CaseTable = dynamic(() => import('./CaseTable'), {
  loading: () => (
    <SkeletonLoader repeat={3} height={44} space={2} borderRadius="standard" />
  ),
})

export const CaseTableInProgress = ({
  cases,
  paging,
  isLoading,
}: TableProps) => {
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
      children: formatMessage(messages.tables.inProgress.columns.publishDate),
    },
    {
      name: 'caseDepartment',
      sortable: false,
      size: 'tiny',
      children: formatMessage(messages.tables.inProgress.columns.department),
    },
    {
      name: 'caseTitle',
      sortable: false,
      children: formatMessage(messages.tables.inProgress.columns.title),
    },
    {
      name: 'caseEmployee',
      sortable: true,
      size: 'tiny',
      children: formatMessage(messages.tables.inProgress.columns.employee),
    },
  ]

  const rows = cases?.map((row) => ({
    case: row,
    cells: [
      {
        children: (
          <CaseToolTips
            fastTrack={row.fastTrack}
            status={row.communicationStatus.title}
          />
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
      {
        sortingKey: 'caseEmployee',
        sortingValue: row.assignedTo?.displayName,
        children: (
          <Text truncate variant="medium">
            {row.assignedTo?.displayName}
          </Text>
        ),
      },
    ],
  }))

  return (
    <CaseTable
      loading={isLoading}
      columns={columns}
      rows={rows}
      paging={paging}
      defaultSort={{ direction: 'asc', key: 'casePublishDate' }}
    />
  )
}
