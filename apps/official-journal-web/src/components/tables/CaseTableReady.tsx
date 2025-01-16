import { Checkbox, Text } from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { formatDate } from '../../lib/utils'
import { CaseToolTips } from '../case-tooltips/CaseTooltips'
import CaseTable, { CaseTableHeadCellProps } from './CaseTable'
import * as styles from './CaseTable.css'
import { messages } from './messages'

type Props = {
  cases?: Case[]
  selectedCaseIds: string[]
  isLoading?: boolean
  toggleAll: () => void
  toggle: (_case: Case, checked: boolean) => void
}

export const CaseTableReady = ({
  cases,
  selectedCaseIds,
  toggle,
  toggleAll,
  isLoading,
}: Props) => {
  const { formatMessage } = useFormatMessage()

  const columns: CaseTableHeadCellProps[] = [
    {
      name: 'select',
      sortable: false,
      size: 'tiny',
      children: (
        <Checkbox
          defaultChecked={selectedCaseIds.length === cases?.length}
          checked={selectedCaseIds.length === cases?.length}
          onChange={() => toggleAll()}
        />
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
                onChange={(e) => toggle(_case, e.target.checked)}
                checked={selectedCaseIds.some((id) => id === _case.id)}
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
    <CaseTable
      loading={isLoading}
      columns={columns}
      rows={caseTableColumns}
      defaultSort={{ direction: 'asc', key: 'casePublishDate' }}
    />
  )
}

export default CaseTableReady
