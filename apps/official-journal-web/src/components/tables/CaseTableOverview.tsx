import dynamic from 'next/dynamic'

import { SkeletonLoader, Tag, Text } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { formatDate, getOverviewStatusColor } from '../../lib/utils'
import { CaseTableHeadCellProps } from './CaseTable'
import * as styles from './CaseTable.css'
import { messages } from './messages'
import { PublishedTableProps } from './types'

const CaseTable = dynamic(() => import('./CaseTable'), {
  loading: () => (
    <SkeletonLoader repeat={3} height={44} space={2} borderRadius="standard" />
  ),
})

export const CaseTableOverview = ({
  cases,
  paging,
  isLoading,
}: PublishedTableProps) => {
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
      name: 'publicationNumber',
      sortable: false,
      size: 'tiny',
      children: formatMessage(
        messages.tables.overview.columns.publicationNumber,
      ),
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

  const rows = cases?.map((row) => ({
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
        children: (
          <Tag variant={getOverviewStatusColor(row.status.title)}>
            {row.status.title}
          </Tag>
        ),
      },
      {
        children: <Text variant="medium">{row.publicationNumber}</Text>,
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
      loading={isLoading}
      columns={columns}
      rows={rows}
      paging={paging}
      defaultSort={{ direction: 'asc', key: 'casePublishDate' }}
    />
  )
}
