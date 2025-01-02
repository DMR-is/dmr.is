import { useRouter } from 'next/router'
import { ChangeEvent } from 'react'

import { AlertMessage, Checkbox, Stack, Text } from '@island.is/island-ui/core'

import { CaseStatusTitleEnum } from '../../gen/fetch'
import { useCases } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { usePublishContext } from '../../hooks/usePublishContext'
import { getStringFromQueryString } from '../../lib/types'
import { formatDate } from '../../lib/utils'
import { CaseToolTips } from '../case-tooltips/CaseTooltips'
import { CaseTable, CaseTableHeadCellProps } from './CaseTable'
import * as styles from './CaseTable.css'
import { messages } from './messages'

export const CaseTableReady = () => {
  const { formatMessage } = useFormatMessage()
  const {
    publishingState,
    addCaseToSelectedList,
    removeCaseFromSelectedList,
    addManyCasesToSelectedList,
    removeAllCasesFromSelectedList,
  } = usePublishContext()
  const { selectedCaseIds } = publishingState
  const router = useRouter()
  const department = getStringFromQueryString(router.query.department)

  const {
    data: caseData,
    isLoading,
    error,
  } = useCases({
    params: {
      department: department,
      status: CaseStatusTitleEnum.Tilbúið,
    },
    options: {
      refreshInterval: 1000 * 60,
    },
  })

  const handleToggleAll = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      if (!caseData?.cases) return
      addManyCasesToSelectedList(caseData?.cases.map((row) => row.id))
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
      name: 'casePublishDate',
      sortable: false,
      size: 'tiny',
      children: formatMessage(messages.tables.ready.columns.title),
    },
    {
      name: 'caseTitle',
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

  const rows =
    caseData?.cases.map((row) => {
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
            children: (
              <CaseToolTips
                fastTrack={row.fastTrack}
                status={row.communicationStatus.title}
              />
            ),
          },
          {
            sortingKey: 'caseAdvertType',
            sortingValue: row.advertType.title,
            children: (
              <div className={styles.titleTableCell}>
                <Text truncate variant="medium">
                  {row.advertType.title} {row.advertTitle}
                </Text>
              </div>
            ),
          },
          {
            sortingKey: 'casePublishDate',
            sortingValue: row.requestedPublicationDate,
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
    }) ?? []

  return (
    <Stack space={[2, 2, 3]}>
      {error && (
        <AlertMessage
          type="error"
          title="Villa kom upp"
          message="Ekki tókst að sækja tilbúin mál"
        />
      )}
      <CaseTable
        loading={isLoading}
        columns={columns}
        rows={rows}
        defaultSort={{ direction: 'asc', key: 'casePublishDate' }}
      />
    </Stack>
  )
}
