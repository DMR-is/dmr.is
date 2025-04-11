import { Text } from '@island.is/island-ui/core'

import { Advert } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import CaseTable, { CaseTableHeadCellProps } from './CaseTable'
import * as styles from './CaseTable.css'
import { messages } from './messages'

type Props = {
  adverts?: Advert[]
  isLoading?: boolean
}

export const AdvertPDFTable = ({ adverts, isLoading }: Props) => {
  const { formatMessage } = useFormatMessage()

  const columns: CaseTableHeadCellProps[] = [
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

  const advertTableColumns =
    adverts?.map((advert) => {
      return {
        case: advert,
        cells: [
          {
            sortingKey: 'advertTitle',
            sortingValue: advert.title,
            children: (
              <div className={styles.titleTableCell}>
                <Text truncate variant="medium">
                  {advert.title}
                </Text>
              </div>
            ),
          },
          {
            sortingKey: 'advertPublicationNumber',
            sortingValue: advert.publicationNumber?.full,
            children: (
              <div className={styles.titleTableCell}>
                <Text truncate variant="medium">
                  {advert.publicationNumber?.full}
                </Text>
              </div>
            ),
          },
          {
            sortingKey: 'advertSubject',
            sortingValue: advert.subject,
            children: (
              <div className={styles.titleTableCell}>
                <Text truncate variant="medium">
                  {advert.subject}
                </Text>
              </div>
            ),
          },
          /*  {
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
          },*/
        ],
      }
    }) ?? []

  return (
    <CaseTable
      loading={isLoading}
      columns={columns}
      rows={advertTableColumns}
      defaultSort={{ direction: 'asc', key: 'casePublishDate' }}
    />
  )
}

export default AdvertPDFTable
