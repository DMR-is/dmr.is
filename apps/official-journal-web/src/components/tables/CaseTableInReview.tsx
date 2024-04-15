import { Text } from '@island.is/island-ui/core'

import { Case, Paging } from '../../gen/fetch'
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

type Props = {
  data: Case[]
  paging: Paging
}

export const CaseTableInReview = ({ data, paging }: Props) => {
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
        sortingValue: row.advert.publicationDate ?? '',
        children: (
          <Text variant="medium">
            {formatDate(row.advert.publicationDate ?? '')}
          </Text>
        ),
      },
      {
        sortingKey: 'caseRegistrationDate',
        sortingValue: row.advert.createdDate,
        children: (
          <Text variant="medium">{formatDate(row.advert.createdDate)}</Text>
        ),
      },
      {
        sortingKey: 'caseDepartment',
        sortingValue: row.advert.department.title,
        children: (
          <Text truncate variant="medium">
            {row.advert.department.title}
          </Text>
        ),
      },
      {
        sortingKey: 'caseName',
        sortingValue: row.advert.title,
        children: (
          <div className={styles.nameTableCell}>
            <Text truncate variant="medium">
              {row.advert.title}
            </Text>
          </div>
        ),
      },
      {
        sortingKey: 'caseEmployee',
        sortingValue: row.assignedTo.name,
        children: (
          <Text truncate variant="medium">
            {row.assignedTo.name}
          </Text>
        ),
      },
      {
        sortingKey: 'caseTag',
        sortingValue: row.tag,
        children: <CaseTag tag={row.tag} />,
      },
    ],
  }))

  return <CaseTable columns={columns} rows={rows} paging={paging} />
}
