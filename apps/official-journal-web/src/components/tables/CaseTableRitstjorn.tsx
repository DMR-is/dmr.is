import { DataTable } from '@dmr.is/ui/components/Tables/DataTable/DataTable'
import { DataTableColumnProps } from '@dmr.is/ui/components/Tables/DataTable/types'

import { Tag, Text } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { Routes } from '../../lib/constants'
import { formatDate, getOverviewStatusColor } from '../../lib/utils'
import { CaseTag } from '../case-tag/CaseTag'
import { CaseToolTips } from '../case-tooltips/CaseTooltips'
import * as styles from './CaseTable.css'
import { messages } from './messages'
import { TableProps } from './types'

export const CaseTableRitstjorn = ({ cases, paging }: TableProps) => {
  const { formatMessage } = useFormatMessage()

  const columns: DataTableColumnProps[] = [
    {
      field: 'caseLabels',
      sortable: false,
      size: 'tiny',
    },
    {
      field: 'caseRequestPublishDate',
      sortable: true,
      size: 'tiny',
      children: formatMessage(messages.tables.inProgress.columns.publishDate),
    },
    {
      field: 'caseRegistrationDate',
      sortable: true,
      size: 'tiny',
      children: formatMessage(
        messages.tables.submitted.columns.registrationDate,
      ),
    },
    {
      field: 'caseDepartment',
      sortable: false,
      size: 'tiny',
      children: formatMessage(messages.tables.inProgress.columns.department),
    },
    {
      field: 'caseTitle',
      sortable: false,
      children: formatMessage(messages.tables.inProgress.columns.title),
    },
    {
      field: 'caseEmployee',
      sortable: true,
      size: 'tiny',
      children: formatMessage(messages.tables.inProgress.columns.employee),
    },
    {
      field: 'caseStatus',
      sortable: true,
      size: 'tiny',
      children: formatMessage(messages.tables.overview.columns.status),
    },
    {
      field: 'caseTag',
      sortable: false,
      size: 'tiny',
      children: formatMessage(messages.tables.inReview.columns.tags),
    },
  ]

  const rows = cases?.map((row) => {
    return {
      href: Routes.ProccessingDetail.replace(':caseId', row.id),
      uniqueKey: row.id,
      hasLink: true,
      caseLabels: (
        <CaseToolTips
          fastTrack={row.fastTrack}
          status={row.communicationStatus.title}
        />
      ),
      caseRequestPublishDate: (
        <Text variant="medium">{formatDate(row.requestedPublicationDate)}</Text>
      ),
      caseRegistrationDate: (
        <Text variant="medium">{formatDate(row.createdAt)}</Text>
      ),
      caseDepartment: (
        <Text truncate variant="medium">
          {row.advertDepartment.title}
        </Text>
      ),
      caseTitle: (
        <div className={styles.titleTableCell} title={row.advertTitle}>
          <Text truncate variant="medium">
            {row.advertType.title} {row.advertTitle}
          </Text>
        </div>
      ),
      caseEmployee: (
        <Text truncate variant="medium">
          {row.assignedTo?.displayName}
        </Text>
      ),
      caseStatus: (
        <Tag variant={getOverviewStatusColor(row.status.title)}>
          {row.status.title}
        </Tag>
      ),
      caseTag: <CaseTag tag={row.tag?.title} />,
    }
  })

  return <DataTable columns={columns} rows={rows} paging={paging} />
}
