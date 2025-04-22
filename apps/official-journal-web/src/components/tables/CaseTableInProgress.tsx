import dynamic from 'next/dynamic'

// import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
// import {
//   DEFAULT_SORT_DIRECTION,
//   SortDirection,
// } from '@dmr.is/ui/hooks/constants'
// import { useFilters } from '@dmr.is/ui/hooks/useFilters'
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
  // const { params, setParams } = useFilters()

  // const handleSort = (field: string) => {
  //   const isSameField = params.sortBy === field

  //   if (isSameField) {
  //     return setParams({
  //       direction:
  //         params.direction === SortDirection.ASC
  //           ? SortDirection.DESC
  //           : SortDirection.ASC,
  //     })
  //   }

  //   setParams({
  //     sortBy: field,
  //     direction: DEFAULT_SORT_DIRECTION,
  //   })
  // }

  // const newColumns = [
  //   {
  //     field: 'casePublishDate',
  //     children: formatMessage(messages.tables.inProgress.columns.publishDate),
  //     onSort: handleSort,
  //     sortBy: params.sortBy ?? undefined,
  //     direction: params.direction,
  //   },
  //   {
  //     field: 'caseDepartment',
  //     children: formatMessage(messages.tables.inProgress.columns.department),
  //     onSort: handleSort,
  //     sortBy: params.sortBy ?? undefined,
  //     direction: params.direction,
  //   },
  //   {
  //     field: 'caseTitle',
  //     children: formatMessage(messages.tables.inProgress.columns.title),
  //     onSort: handleSort,
  //     sortBy: params.sortBy ?? undefined,
  //     direction: params.direction,
  //   },
  //   {
  //     field: 'caseEmployee',
  //     children: formatMessage(messages.tables.inProgress.columns.employee),
  //     onSort: handleSort,
  //     sortBy: params.sortBy ?? undefined,
  //     direction: params.direction,
  //   },
  // ]

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

  // const newRows = cases?.map((row) => {
  //   return {
  //     uniqueKey: row.id,
  //     hasLink: true,
  //     casePublishDate: (
  //       <Text variant="medium">{formatDate(row.requestedPublicationDate)}</Text>
  //     ),
  //     caseDepartment: (
  //       <Text truncate variant="medium">
  //         {row.advertDepartment.title}
  //       </Text>
  //     ),
  //     caseTitle: (
  //       <div className={styles.titleTableCell} title={row.advertTitle}>
  //         <Text truncate variant="medium">
  //           {row.advertType.title} {row.advertTitle}
  //         </Text>
  //       </div>
  //     ),
  //     caseEmployee: (
  //       <Text truncate variant="medium">
  //         {row.assignedTo?.displayName}
  //       </Text>
  //     ),
  //   }
  // })

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

  // return (
  //   <DataTable
  //     columns={newColumns}
  //     rows={newRows}
  //     paging={paging}
  //     loading={isLoading}
  //   />
  // )
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
