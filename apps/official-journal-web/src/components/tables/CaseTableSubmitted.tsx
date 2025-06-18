import { DataTable } from '@dmr.is/ui/components/Tables/DataTable/DataTable'
import { DataTableColumnProps } from '@dmr.is/ui/components/Tables/DataTable/types'

import { Text } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { Routes } from '../../lib/constants'
import { formatDate } from '../../lib/utils'
import { CaseToolTips } from '../case-tooltips/CaseTooltips'
import * as styles from './CaseTable.css'
import { messages } from './messages'
import { TableProps } from './types'

export const CaseTableSubmitted = ({ cases, paging }: TableProps) => {
  const { formatMessage } = useFormatMessage()

  const columns: DataTableColumnProps[] = [
    { field: 'caseLabels', sortable: false, size: 'tiny' },
    {
      field: 'caseRequestPublishDate',
      sortable: true,
      size: 'tiny',
      children: formatMessage(
        messages.tables.submitted.columns.publicationDate,
      ),
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
      children: formatMessage(messages.tables.submitted.columns.department),
    },
    {
      field: 'caseTitle',
      sortable: false,
      children: formatMessage(messages.tables.submitted.columns.title),
    },
    {
      field: 'caseEmployee',
      sortable: false,
      children: formatMessage(messages.tables.submitted.columns.employee),
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
    }
  })

  return <DataTable columns={columns} rows={rows} paging={paging} />
}
