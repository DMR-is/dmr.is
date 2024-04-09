import { Text } from '@island.is/island-ui/core'

import { Paging } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { CaseTableItem, formatDate } from '../../lib/utils'
import { CaseTag } from '../case-tag/CaseTag'
import { CaseTable } from './CaseTable'
import * as styles from './CaseTable.css'
import { messages } from './messages'

type Props = {
  data: CaseTableItem[]
  paging: Paging
}

export const CaseTableOverview = ({ data, paging }: Props) => {
  const { formatMessage } = useFormatMessage()

  const columns = [
    {
      name: 'casePublishDate',
      sortable: false,
      small: true,
      children: formatMessage(messages.tables.overview.columns.publishDate),
    },

    {
      name: 'caseStatus',
      sortable: false,
      small: true,
      children: formatMessage(messages.tables.overview.columns.status),
    },
    {
      name: 'caseTitle',
      sortable: false,
      small: false,
      children: formatMessage(messages.tables.overview.columns.title),
    },
    {
      name: 'caseInstitution',
      sortable: false,
      small: true,
      children: formatMessage(messages.tables.overview.columns.institution),
    },
  ]

  const rows = data.map((row) => ({
    caseId: row.id,
    status: row.status,
    cells: [
      {
        children: (
          <Text variant="medium">{formatDate(row.publicationDate)}</Text>
        ),
      },
      {
        children: row.published ? (
          <Text variant="medium">{`${row.number}/${row.year}`}</Text>
        ) : (
          <CaseTag tag={row.status} />
        ),
      },
      {
        children: (
          <div className={styles.nameTableCell}>
            <Text truncate variant="medium">
              {row.title}
            </Text>
          </div>
        ),
      },
      {
        children: (
          <Text truncate variant="medium">
            {row.institution}
          </Text>
        ),
      },
    ],
  }))

  return <CaseTable columns={columns} rows={rows} paging={paging} />
}
