import { Checkbox, Text } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { formatDate } from '../../lib/utils'
import { CaseLabelTooltip } from '../tooltips/CaseLabelTooltip'
import { CaseTable } from './CaseTable'
import * as styles from './CaseTable.css'
import { messages } from './messages'

export type CaseReadyForPublishing = {
  id: string
  labels: string[]
  caseNumber: string
  title: string
  publicationDate: string | null
  institution: string
}

type Props = {
  data: CaseReadyForPublishing[]
  selectedCases: CaseReadyForPublishing[]
  setSelectedCases: React.Dispatch<
    React.SetStateAction<CaseReadyForPublishing[]>
  >
}

export const CaseTableReady = ({
  data,
  setSelectedCases,
  selectedCases,
}: Props) => {
  const { formatMessage } = useFormatMessage()

  const columns = [
    {
      name: 'select',
      sortable: false,
      small: true,
      children: (
        <Checkbox
          onChange={(e) => {
            setSelectedCases(e.target.checked ? data : [])
          }}
        />
      ),
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
      children: formatMessage(messages.tables.ready.columns.title),
    },
    {
      name: 'caseName',
      sortable: false,
      small: false,
      children: formatMessage(messages.tables.ready.columns.publicationDate),
    },
    {
      name: 'caseInstitution',
      sortable: false,
      small: true,
      children: formatMessage(messages.tables.ready.columns.institution),
    },
  ]

  const rows = data.map((row) => ({
    caseId: row.id,
    cells: [
      {
        children: (
          <Checkbox
            checked={selectedCases.some((c) => c.id === row.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedCases((prev) => prev.concat(row))
              } else {
                setSelectedCases((prev) => prev.filter((c) => c.id !== row.id))
              }
            }}
          />
        ),
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
