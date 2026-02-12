import { useState } from 'react'

import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { Advert, Paging } from '../../gen/fetch'
import { useMigrateAdvertToCase } from '../../hooks/api/update/useMigrateAdvertToCase'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import CaseTable, { CaseTableHeadCellProps } from './CaseTable'
import * as styles from './CaseTable.css'
import { messages } from './messages'

type Props = {
  adverts?: Advert[]
  isLoading?: boolean
  paging?: Paging
}

export const AdvertMigrationTable = ({ adverts, isLoading, paging }: Props) => {
  const { formatMessage } = useFormatMessage()
  const { migrateAdvertToCase, loading: migrating } = useMigrateAdvertToCase()
  const [migratingId, setMigratingId] = useState<string | null>(null)

  const handleMigrate = async (advertId: string) => {
    setMigratingId(advertId)
    await migrateAdvertToCase({ advertId })
    setMigratingId(null)
  }

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
      name: 'advertMigrate',
      sortable: false,
      size: 'default',
    },
  ]

  const advertTableColumns =
    adverts?.map((advert) => {
      const isMigrating = migratingId === advert.id

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
            sortingKey: 'advertMigrate',
            sortingValue: advert.id,
            children: (
              <Button
                variant="text"
                size="small"
                loading={isMigrating}
                disabled={migrating}
                onClick={() => handleMigrate(advert.id)}
              >
                {formatMessage(messages.tables.advert.columns.migrate)}
                {!isMigrating && (
                  <Icon
                    icon="arrowForward"
                    color="blue400"
                    className={styles.seeMoreTableCellLinkIcon}
                  />
                )}
              </Button>
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
      defaultSort={{ direction: 'asc', key: 'advertPublicationNumber' }}
      paging={paging}
    />
  )
}

export default AdvertMigrationTable
