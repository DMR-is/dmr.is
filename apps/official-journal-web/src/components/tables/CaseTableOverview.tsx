import { Text } from '@island.is/island-ui/core'

import { Case, Paging } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { formatDate } from '../../lib/utils'
import { CaseTag } from '../case-tag/CaseTag'
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

export const CaseTableOverview = ({ data, paging }: Props) => {
  const { formatMessage } = useFormatMessage()

  const columns: CaseTableHeadCellProps[] = [
    {
      name: 'casePublishDate',
      sortable: false,
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

  const rows: CaseTableRowProps[] = data.map((row) => ({
    case: row,
    cells: [
      {
        children: (
          <Text variant="medium">
            {formatDate(row.advert.publicationDate ?? '')}
          </Text>
        ),
      },
      {
        children: row.published ? (
          <Text variant="medium">{row.advert.publicationNumber?.full}</Text>
        ) : (
          <CaseTag tag={row.status} />
        ),
      },
      {
        children: (
          <div className={styles.nameTableCell}>
            <Text truncate variant="medium">
              {row.advert.title}
            </Text>
          </div>
        ),
      },
      {
        children: (
          <Text truncate variant="medium">
            {row.advert.involvedParty.title}
          </Text>
        ),
      },
    ],
  }))

  return <CaseTable columns={columns} rows={rows} paging={paging} />
}
