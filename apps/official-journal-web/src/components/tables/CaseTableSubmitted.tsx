import { Text } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { CaseTableItem, formatDate } from '../../lib/utils'
import { CaseLabelTooltip } from '../tooltips/CaseLabelTooltip'
import { CaseTable } from './CaseTable'
import * as styles from './CaseTable.css'
import { messages } from './messages'

type Props = {
  data: Array<CaseTableItem>
}

export const CaseTableSubmitted = ({ data }: Props) => {
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

  const rows = data.map((row) => ({
    caseId: row.id,
    status: row.status,
    cells: [
      {
        children: row.labels.length > 0 && (
          <div className={styles.iconWrapper}>
            {row.labels.map((label, index) => (
              <CaseLabelTooltip label={label} key={index} />
            ))}
          </div>
        ),
      },
      {
        sortingKey: 'casePublishDate',
        sortingValue: row.publicationDate,
        children: (
          <Text variant="medium">{formatDate(row.publicationDate)}</Text>
        ),
      },
      {
        sortingKey: 'caseRegistrationDate',
        sortingValue: row.registrationDate,
        children: (
          <Text variant="medium">{formatDate(row.registrationDate)}</Text>
        ),
      },
      {
        sortingKey: 'caseDepartment',
        sortingValue: row.department,
        children: (
          <Text truncate variant="medium">
            {row.department}
          </Text>
        ),
      },
      {
        sortingKey: 'caseName',
        sortingValue: row.title,
        children: (
          <div className={styles.nameTableCell}>
            <Text truncate variant="medium">
              {row.title}
            </Text>
          </div>
        ),
      },
    ],
  }))

  return <CaseTable columns={columns} rows={rows} />
}
