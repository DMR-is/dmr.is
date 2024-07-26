import { useRouter } from 'next/router'
import { ChangeEvent } from 'react'

import {
  AlertMessage,
  Checkbox,
  SkeletonLoader,
  Text,
} from '@island.is/island-ui/core'

import { CaseStatusEnum } from '../../gen/fetch'
import { useCases } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { usePublishContext } from '../../hooks/usePublishContext'
import { messages as errorMessages } from '../../lib/messages/errors'
import { getStringFromQueryString } from '../../lib/types'
import { formatDate } from '../../lib/utils'
import { CaseLabelTooltip } from '../tooltips/CaseLabelTooltip'
import {
  CaseTable,
  CaseTableHeadCellProps,
  CaseTableRowProps,
} from './CaseTable'
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
      status: CaseStatusEnum.Tilbi,
    },
    options: {
      refreshInterval: 1000 * 60,
    },
  })

  if (isLoading) {
    return <SkeletonLoader repeat={3} height={44} space={2} />
  }

  if (error) {
    return (
      <AlertMessage
        type="error"
        title={formatMessage(errorMessages.error)}
        message={formatMessage(errorMessages.error)}
      />
    )
  }

  if (!caseData) {
    return (
      <AlertMessage
        type="error"
        title="Engin mál fundust"
        message="Mál birtast þegar þau eru færð í stöðuna 'Tilbúið'"
      />
    )
  }

  const { cases } = caseData

  const handleToggleAll = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      addManyCasesToSelectedList(cases.map((row) => row.id))
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
      name: 'caseAdvertType',
      sortable: true,
      children: formatMessage(messages.tables.general.type),
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

  const rows: CaseTableRowProps[] = cases.map((row) => {
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
