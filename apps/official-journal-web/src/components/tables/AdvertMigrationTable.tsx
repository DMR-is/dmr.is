'use client'

import { useState } from 'react'

import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { Advert, Paging } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { useTRPC } from '../../lib/trpc/client/trpc'
import CaseTable, { CaseTableHeadCellProps } from './CaseTable'
import * as styles from './CaseTable.css'
import { messages } from './messages'

import { useMutation } from '@tanstack/react-query'

type Props = {
  adverts?: Advert[]
  isLoading?: boolean
  paging?: Paging
}

export const AdvertMigrationTable = ({ adverts, isLoading, paging }: Props) => {
  const { formatMessage } = useFormatMessage()

  const trpc = useTRPC()
  const migrateMutation = useMutation(
    trpc.migrateAdvertToCase.mutationOptions({
      onSuccess: () => {
        toast.success('Mál hefur verið stofnað út frá auglýsingu', {
          toastId: 'migrateAdvertToCase',
        })
      },
      onError: () => {
        toast.error('Ekki tókst að stofna mál út frá auglýsingu', {
          toastId: 'migrateAdvertToCase',
        })
      },
    }),
  )
  const [migratingId, setMigratingId] = useState<string | null>(null)

  const handleMigrate = async (advertId: string) => {
    setMigratingId(advertId)
    await migrateMutation.mutateAsync({ advertId })
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
                disabled={migrateMutation.isPending}
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
