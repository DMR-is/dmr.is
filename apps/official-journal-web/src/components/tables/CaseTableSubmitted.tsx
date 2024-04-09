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

export const CaseTableSubmitted = ({ data, paging }: Props) => {
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
      children: formatMessage(
        messages.tables.submitted.columns.publicationDate,
      ),
    },
    {
      name: 'caseRegistrationDate',
      sortable: true,
      small: true,
      children: formatMessage(
        messages.tables.submitted.columns.registrationDate,
      ),
    },
    {
      name: 'caseDepartment',
      sortable: true,
      small: true,
      children: formatMessage(messages.tables.submitted.columns.department),
    },
    {
      name: 'caseName',
      sortable: true,
      small: false,
      children: formatMessage(messages.tables.submitted.columns.title),
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
    ],
  }))

  return <CaseTable paging={paging} columns={columns} rows={rows} />
}
