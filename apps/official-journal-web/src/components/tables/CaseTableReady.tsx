import { Checkbox, Text } from '@island.is/island-ui/core'

import { Case, Paging } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { formatDate } from '../../lib/utils'
import { CaseLabelTooltip } from '../tooltips/CaseLabelTooltip'
import { CaseTable, CaseTableRowProps } from './CaseTable'
import * as styles from './CaseTable.css'
import { messages } from './messages'

type Props = {
  data: Case[]
  paging: Paging
  selectedCases: Case[]
  setSelectedCases: React.Dispatch<React.SetStateAction<Case[]>>
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

  const rows: CaseTableRowProps[] = data.map((row) => ({
    case: row,
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
        children: row.fastTrack && (
          <div className={styles.iconWrapper}>
            {row.fastTrack && <CaseLabelTooltip label={'fasttrack'} />}
          </div>
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
          <Text variant="medium">
            {row.advert.publicationDate
              ? formatDate(row.advert.publicationDate)
              : null}
          </Text>
        ),
      },
      {
        children: (
          <Text whiteSpace="nowrap" variant="medium">
            {row.advert.involvedParty.title}
          </Text>
        ),
      },
    ],
  }))

  return <CaseTable columns={columns} rows={rows} modalLink />
}
