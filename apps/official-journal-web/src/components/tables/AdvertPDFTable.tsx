import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { Advert, Paging } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { Routes } from '../../lib/constants'
import CaseTable, { CaseTableHeadCellProps } from './CaseTable'
import * as styles from './CaseTable.css'
import { messages } from './messages'

type Props = {
  adverts?: Advert[]
  isLoading?: boolean
  paging?: Paging
}

export const AdvertPDFTable = ({ adverts, isLoading, paging }: Props) => {
  const { formatMessage } = useFormatMessage()

  const columns: CaseTableHeadCellProps[] = [
    {
      name: 'advertPublicationNumber',
      sortable: false,
      size: 'small',
      children: formatMessage(messages.tables.advert.columns.publicationNumber),
    },
    {
      name: 'advertTitle',
      sortable: false,
      size: 'tiny',
      children: formatMessage(messages.tables.advert.columns.title),
    },

    {
      name: 'advertFile',
      sortable: false,
      size: 'default',
    },
    {
      name: 'advertFile',
      sortable: false,
      size: 'default',
    },
  ]

  const advertTableColumns =
    adverts?.map((advert) => {
      return {
        case: advert,
        cells: [
          {
            sortingKey: 'advertPublicationNumber',
            sortingValue: advert.publicationNumber?.full,
            children: (
              <Text truncate variant="medium">
                {advert.publicationNumber?.full}
              </Text>
            ),
          },
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
            sortingKey: 'advertpdf',
            sortingValue: advert.subject,
            children: (
              <Box
                component={'a'}
                href={advert.document.pdfUrl ?? '#'}
                target="_blank"
              >
                <Text variant="eyebrow" color={'blue400'}>
                  {formatMessage(messages.tables.advert.columns.seeFile)}{' '}
                  <Icon
                    icon="arrowForward"
                    color="blue400"
                    className={styles.seeMoreTableCellLinkIcon}
                  />
                </Text>
              </Box>
            ),
          },
          {
            sortingKey: 'advertpdf',
            sortingValue: advert.subject,
            children: (
              <Box
                component={'a'}
                href={Routes.ReplacePdfAdvert.replace(':advertId', advert.id)}
              >
                <Text variant="eyebrow" color={'blue400'}>
                  {formatMessage(messages.tables.advert.columns.change)}{' '}
                  <Icon
                    icon="arrowForward"
                    color="blue400"
                    className={styles.seeMoreTableCellLinkIcon}
                  />
                </Text>
              </Box>
            ),
          },
        ],
      }
    }) ?? []

  return (
    <CaseTable
      loading={isLoading}
      columns={columns}
      renderLink={false}
      rows={advertTableColumns}
      defaultSort={{ direction: 'asc', key: 'casePublishDate' }}
      paging={paging}
    />
  )
}

export default AdvertPDFTable
