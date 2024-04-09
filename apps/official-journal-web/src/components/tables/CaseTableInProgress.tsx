import { Text } from '@island.is/island-ui/core'

import { Case, Paging } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { formatDate } from '../../lib/utils'
import { CaseLabelTooltip } from '../tooltips/CaseLabelTooltip'
import { CaseTable, CaseTableRowProps } from './CaseTable'
import * as styles from './CaseTable.css'
import { messages } from './messages'

type Props = {
  data: Array<Case>
  paging: Paging
}
export const CaseTableInProgress = ({ data, paging }: Props) => {
  const { formatMessage } = useFormatMessage()

  const columns = [
    {
      name: 'caseLabels',
      sortable: false,
      small: true,
    },
    {
      name: 'casePublishDate',
      sortable: true,
      small: true,
      children: formatMessage(messages.tables.inProgress.columns.publishDate),
    },
    {
      name: 'caseDepartment',
      sortable: true,
      small: true,
      children: formatMessage(messages.tables.inProgress.columns.department),
    },
    {
      name: 'caseName',
      sortable: true,
      small: false,
      children: formatMessage(messages.tables.inProgress.columns.title),
    },
    {
      name: 'caseEmployee',
      sortable: true,
      small: true,
      children: formatMessage(messages.tables.inProgress.columns.employee),
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
        sortingValue: row.assignedTo,
        children: (
          <Text truncate variant="medium">
            {row.assignedTo}
          </Text>
        ),
      },
    ],
  }))

  return <CaseTable columns={columns} rows={rows} paging={paging} />
}
