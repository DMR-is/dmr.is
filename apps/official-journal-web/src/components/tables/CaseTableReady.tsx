import { Checkbox, Text } from '@island.is/island-ui/core'

import { Case, Paging } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { formatDate } from '../../lib/utils'
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
  selectedCases: Case[]
  setSelectedCases: React.Dispatch<React.SetStateAction<Case[]>>
  setCasesReadyForPublication: React.Dispatch<React.SetStateAction<Case[]>>
}

export const CaseTableReady = ({
  data,
  setSelectedCases,
  selectedCases,
  setCasesReadyForPublication,
}: Props) => {
  const { formatMessage } = useFormatMessage()

  const columns: CaseTableHeadCellProps[] = [
    {
      name: 'select',
      sortable: false,
      size: 'tiny',
      children: (
        <Checkbox
          onChange={(e) => {
            setSelectedCases(e.target.checked ? data : [])

            setCasesReadyForPublication(e.target.checked ? data : [])
          }}
        />
      ),
    },
    {
      name: 'caseLabels',
      sortable: false,
      size: 'tiny',
    },
    {
      name: 'casePublicationDate',
      sortable: false,
      size: 'tiny',
      children: formatMessage(messages.tables.ready.columns.title),
    },
    {
      name: 'caseName',
      sortable: false,
      children: formatMessage(messages.tables.ready.columns.publicationDate),
    },
    {
      name: 'caseInstitution',
      sortable: false,
      size: 'tiny',
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
                setSelectedCases((prev) => {
                  const cases = prev.concat(row)
                  setCasesReadyForPublication(cases)
                  return cases
                })
              } else {
                setSelectedCases((prev) => {
                  const cases = prev.filter((c) => c.id !== row.id)
                  setCasesReadyForPublication(cases)
                  return cases
                })
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
              {row.advertTitle}
            </Text>
          </div>
        ),
      },
      {
        children: (
          <Text variant="medium">
            {row.requestedPublicationDate
              ? formatDate(row.requestedPublicationDate)
              : null}
          </Text>
        ),
      },
      {
        children: (
          <Text whiteSpace="nowrap" variant="medium">
            Reykjavíkurborg
            {/* TODO: Add involved party to case */}
            {/* {row.institution.title} */}
          </Text>
        ),
      },
    ],
  }))

  return <CaseTable columns={columns} rows={rows} modalLink />
}
