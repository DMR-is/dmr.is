import { DataTable } from '@dmr.is/ui/components/Tables/DataTable/DataTable'
import { DataTableColumnProps } from '@dmr.is/ui/components/Tables/DataTable/types'

import { Tag, Text } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { Routes } from '../../lib/constants'
import { formatDate, getOverviewStatusColor } from '../../lib/utils'
import * as styles from './CaseTable.css'
import { messages } from './messages'
import { PublishedTableProps } from './types'

export const CaseTableOverview = ({
  cases,
  paging,
  isLoading,
}: PublishedTableProps) => {
  const { formatMessage } = useFormatMessage()

  const columns: DataTableColumnProps[] = [
    {
      field: 'casePublishDate',
      sortable: true,

      children: formatMessage(messages.tables.overview.columns.publishDate),
    },
    {
      field: 'caseStatus',
      sortable: true,
      size: 'tiny',
      children: formatMessage(messages.tables.overview.columns.status),
    },
    {
      field: 'publicationNumber',
      sortable: false,
      size: 'tiny',
      children: formatMessage(
        messages.tables.overview.columns.publicationNumber,
      ),
    },
    {
      field: 'caseTitle',
      sortable: false,
      children: formatMessage(messages.tables.overview.columns.title),
    },
    {
      field: 'caseInstitution',
      sortable: false,
      size: 'tiny',
      children: formatMessage(messages.tables.overview.columns.institution),
    },
  ]

  const rows = cases?.map((row) => {
    return {
      href: Routes.ProccessingDetail.replace(':caseId', row.id),
      uniqueKey: row.id,
      hasLink: true,
      casePublishDate: (
        <Text variant="medium">{formatDate(row.publishedAt)}</Text>
      ),
      caseStatus: (
        <Tag variant={getOverviewStatusColor(row.status.title)}>
          {row.status.title}
        </Tag>
      ),
      publicationNumber: (
        <Text variant="medium">
          {row.publicationNumber}/{row.year}
        </Text>
      ),
      caseTitle: (
        <div className={styles.titleTableCell}>
          <Text truncate variant="medium">
            {row.advertType.title} {row.advertTitle}
          </Text>
        </div>
      ),
      caseInstitution: (
        <div className={styles.typeTableCell}>
          <Text truncate variant="medium">
            {row.involvedParty.title}
          </Text>
        </div>
      ),
    }
  })

  return (
    <DataTable
      loading={isLoading}
      columns={columns}
      rows={rows}
      paging={paging}
    />
  )
}
