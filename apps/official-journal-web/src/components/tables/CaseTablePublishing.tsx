import { Checkbox, Text } from '@island.is/island-ui/core'

import { messages } from '../../lib/messages'
import { formatDate } from '../../lib/utils'
import { CaseLabelTooltip } from '../tooltips/CaseLabelTooltip'
import { CaseTable } from './CaseTable'
import * as styles from './CaseTable.css'

type Props = {
  data: {
    id: string
    labels: string[]
    title: string
    publicationDate: string | null
    institution: string
  }[]
}

export const CaseTablePublishing = ({ data }: Props) => {
  const columns = [
    {
      name: 'select',
      sortable: false,
      small: true,
      children: <Checkbox />,
    },
    {
      name: 'caseLabels',
      sortable: false,
      small: true,
    },
    {
      name: 'casePublicationDate',
      sortable: false,
      small: true,
      children: messages.components.tables.caseOverview.headCells.title,
    },
    {
      name: 'caseName',
      sortable: false,
      small: false,
      children:
        messages.components.tables.caseOverview.headCells.publicationDate,
    },
    {
      name: 'caseInstitution',
      sortable: false,
      small: true,
      children: 'Stofnun',
    },
  ]

  const rows = data.map((row) => ({
    caseId: row.id,
    cells: [
      {
        children: <Checkbox />,
      },
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
          <Text variant="medium">
            {row.publicationDate ? formatDate(row.publicationDate) : null}
          </Text>
        ),
      },
      {
        children: (
          <Text whiteSpace="nowrap" variant="medium">
            {row.institution}
          </Text>
        ),
      },
    ],
  }))

  return <CaseTable columns={columns} rows={rows} />
}
