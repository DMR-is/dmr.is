import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
import { DataTableColumnProps } from '@dmr.is/ui/components/Tables/DataTable/types'

import { Checkbox, Text } from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { Routes } from '../../lib/constants'
import { formatDate } from '../../lib/utils'
import { CaseToolTips } from '../case-tooltips/CaseTooltips'
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

  const allChecked =
    selectedCaseIds.length > 0 && selectedCaseIds.length === cases?.length

  const columns: DataTableColumnProps[] = [
    {
      field: 'select',
      sortable: false,
      size: 'tiny',
      children: (
        <Checkbox
          defaultChecked={allChecked}
          checked={allChecked}
          onChange={() => toggleAll()}
        />
      ),
    },
    {
      field: 'caseLabels',
      sortable: false,
      size: 'tiny',
    },
    {
      field: 'casePublishDate',
      sortable: false,
      size: 'tiny',
      children: formatMessage(messages.tables.ready.columns.title),
    },
    {
      field: 'caseTitle',
      sortable: false,
      children: formatMessage(messages.tables.ready.columns.publicationDate),
    },
    {
      field: 'caseInstitution',
      sortable: false,
      size: 'tiny',
      children: formatMessage(messages.tables.ready.columns.institution),
    },
  ]

  const rows =
    cases?.map((row) => {
      return {
        uniqueKey: row.id,
        hasLink: true,
        href: Routes.ProccessingDetail.replace(':caseId', row.id),
        select: (
          <Checkbox
            id={row.id}
            name={`case-checkbox-${row.id}`}
            onChange={(e) => toggle(row, e.target.checked)}
            checked={selectedCaseIds.some((id) => id === row.id)}
            value={row.id}
          />
        ),
        caseLabels: (
          <CaseToolTips
            fastTrack={row.fastTrack}
            status={row.communicationStatus.title}
          />
        ),
        caseAdvertType: (
          <div className={styles.titleTableCell}>
            <Text truncate variant="medium">
              {row.advertType.title} {row.advertTitle}
            </Text>
          </div>
        ),
        casePublishDate: (
          <Text variant="medium">
            {row.requestedPublicationDate
              ? formatDate(row.requestedPublicationDate)
              : null}
          </Text>
        ),
        caseInstitution: (
          <Text whiteSpace="nowrap" variant="medium">
            {row.involvedParty.title}
          </Text>
        ),
      }
    }) ?? []

  return <DataTable loading={isLoading} columns={columns} rows={rows} />
}

export default CaseTableReady
