import dynamic from 'next/dynamic'
import { useState } from 'react'

import {
  Button,
  Checkbox,
  Inline,
  LinkV2,
  SkeletonLoader,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { Routes } from '../../lib/constants'
import { formatDate } from '../../lib/utils'
import { CaseToolTips } from '../case-tooltips/CaseTooltips'
import { CasePublishingTable } from './CasePublishingTable'
import { CaseTableHeadCellProps } from './CaseTable'
import * as styles from './CaseTable.css'
import { messages } from './messages'

const CaseTable = dynamic(() => import('./CaseTable'), {
  loading: () => (
    <SkeletonLoader repeat={3} height={44} space={2} borderRadius="standard" />
  ),
})

type Props = {
  cases?: Case[]
  isLoading?: boolean
}

export const CaseTableReady = ({ cases, isLoading }: Props) => {
  const { formatMessage } = useFormatMessage()

  const [selectedCases, setSelectedCases] = useState<Case[]>([])

  const allChecked = selectedCases.length === cases?.length

  const toggle = () =>
    selectedCases.length === cases?.length
      ? setSelectedCases([])
      : setSelectedCases(cases ?? [])

  const columns: CaseTableHeadCellProps[] = [
    {
      name: 'select',
      sortable: false,
      size: 'tiny',
      children: (
        <Checkbox defaultChecked={allChecked} onChange={() => toggle()} />
      ),
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

  const confirmUrl = `${Routes.PublishingConfirm}?caseIds=${selectedCases
    .map((c) => `${c.id}:${c.publicationNumber}`)
    .join(',')}`

  const caseTableColumns =
    cases?.map((_case) => {
      return {
        case: _case,
        cells: [
          {
            children: (
              <Checkbox
                id={_case.id}
                name={`case-checkbox-${_case.id}`}
                onChange={(e) =>
                  e.target.checked
                    ? setSelectedCases([...selectedCases, _case])
                    : setSelectedCases(
                        selectedCases.filter((c) => c.id !== _case.id),
                      )
                }
                checked={selectedCases.some((c) => c.id === _case.id)}
                value={_case.id}
              />
            ),
          },
          {
            children: (
              <CaseToolTips
                fastTrack={_case.fastTrack}
                status={_case.communicationStatus.title}
              />
            ),
          },
          {
            sortingKey: 'caseAdvertType',
            sortingValue: _case.advertType.title,
            children: (
              <div className={styles.titleTableCell}>
                <Text truncate variant="medium">
                  {_case.advertType.title} {_case.advertTitle}
                </Text>
              </div>
            ),
          },
          {
            sortingKey: 'casePublishDate',
            sortingValue: _case.requestedPublicationDate,
            children: (
              <Text variant="medium">
                {_case.requestedPublicationDate
                  ? formatDate(_case.requestedPublicationDate)
                  : null}
              </Text>
            ),
          },
          {
            children: (
              <Text whiteSpace="nowrap" variant="medium">
                {_case.involvedParty.title}
              </Text>
            ),
          },
        ],
      }
    }) ?? []

  return (
    <Stack space={[2, 2, 3]}>
      <CaseTable
        loading={isLoading}
        columns={columns}
        rows={caseTableColumns}
        defaultSort={{ direction: 'asc', key: 'casePublishDate' }}
      />
      <CasePublishingTable
        cases={selectedCases}
        onReorder={(cases) => setSelectedCases(cases)}
      />
      <Inline justifyContent="flexEnd">
        <LinkV2 href={confirmUrl}>
          <Button
            disabled={selectedCases.length === 0}
            icon="arrowForward"
            iconType="filled"
          >
            Gefa út valin mál hallooo
          </Button>
        </LinkV2>
      </Inline>
    </Stack>
  )
}

export default CaseTableReady
