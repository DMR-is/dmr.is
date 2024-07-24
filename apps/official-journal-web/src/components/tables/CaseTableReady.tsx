import { ChangeEvent } from 'react'

import { Checkbox, Text } from '@island.is/island-ui/core'

import { Case, Paging } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { usePublishContext } from '../../hooks/usePublishContext'
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
}

export const CaseTableReady = ({ data }: Props) => {
  const { formatMessage } = useFormatMessage()
  const {
    publishingState,
    addCaseToSelectedList,
    removeCaseFromSelectedList,
    addManyCasesToSelectedList,
    removeAllCasesFromSelectedList,
  } = usePublishContext()
  const { selectedCaseIds } = publishingState

  const handleToggleAll = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      addManyCasesToSelectedList(data.map((row) => row.id))
    } else {
      removeAllCasesFromSelectedList()
    }
  }

  const handleToggleRow = (e: ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target

    if (checked) {
      addCaseToSelectedList(e.target.value)
    } else {
      removeCaseFromSelectedList(e.target.value)
    }
  }

  const columns: CaseTableHeadCellProps[] = [
    {
      name: 'select',
      sortable: false,
      size: 'tiny',
      children: <Checkbox defaultChecked={false} onChange={handleToggleAll} />,
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
      name: 'caseAdvertType',
      sortable: true,
      children: formatMessage(messages.tables.general.type),
    },
    {
      name: 'caseInstitution',
      sortable: false,
      size: 'tiny',
      children: formatMessage(messages.tables.ready.columns.institution),
    },
  ]

  const rows: CaseTableRowProps[] = data.map((row) => {
    return {
      case: row,
      cells: [
        {
          children: (
            <Checkbox
              id={row.id}
              name={`case-checkbox-${row.id}`}
              defaultChecked={false}
              onChange={handleToggleRow}
              checked={selectedCaseIds.includes(row.id)}
              value={row.id}
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
          sortingKey: 'caseAdvertType',
          sortingValue: row.advertType.title,
          children: (
            <div className={styles.nameTableCell}>
              <Text truncate variant="medium">
                {row.advertType.title}
              </Text>
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
              {row.involvedParty.title}
            </Text>
          ),
        },
      ],
    }
  })

  return <CaseTable columns={columns} rows={rows} modalLink />
}
