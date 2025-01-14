import dynamic from 'next/dynamic'

import {
  Checkbox,
  SkeletonLoader,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { formatDate } from '../../lib/utils'
import { CaseToolTips } from '../case-tooltips/CaseTooltips'
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
  const columns: CaseTableHeadCellProps[] = [
    {
      name: 'select',
      sortable: false,
      size: 'tiny',
      children: <Checkbox defaultChecked={false} />,
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
    cases?.map((row) => {
      return {
        case: row,
        cells: [
          {
            children: (
              <Checkbox
                id={row.id}
                name={`case-checkbox-${row.id}`}
                defaultChecked={false}
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
      {isLoading ? (
        <SkeletonLoader
          repeat={3}
          height={44}
          space={2}
          borderRadius="standard"
        />
      ) : (
        <CaseTable
          columns={columns}
          rows={rows}
          defaultSort={{ direction: 'asc', key: 'casePublishDate' }}
        />
      )}
    </Stack>
  )
}

export default CaseTableReady
