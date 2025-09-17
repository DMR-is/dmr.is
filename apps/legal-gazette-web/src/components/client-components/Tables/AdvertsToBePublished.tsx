'use client'

import { useIntl } from 'react-intl'

import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { Checkbox } from '@island.is/island-ui/core'

import { AdvertDto } from '../../../gen/fetch'
import { ritstjornTableMessages } from '../../../lib/messages/ritstjorn/tables'
import { formatDate } from '../../../lib/utils'

type Props = {
  selectedAdvertIds?: string[]
  onToggle?: (advertId: string) => void
  adverts: AdvertDto[]
}

export const AdvertsToBePublished = ({
  adverts = [],
  selectedAdvertIds = [],
  onToggle,
}: Props) => {
  const { formatMessage } = useIntl()

  const rows = adverts.map((advert) => ({
    checkbox: (
      <Checkbox
        checked={selectedAdvertIds.includes(advert.id)}
        onChange={() => onToggle?.(advert.id)}
      />
    ),
    flokkur: advert.category.title,
    efni: advert.title,
    utgafudagur: formatDate(advert.scheduledAt),
    owner: advert.createdBy,
  }))

  return (
    <DataTable
      columns={
        [
          {
            field: 'checkbox',
            children: '',
            size: 'tiny',
          },
          {
            field: 'flokkur',
            children: formatMessage(ritstjornTableMessages.columns.category),
          },
          {
            field: 'efni',
            children: formatMessage(ritstjornTableMessages.columns.content),
          },
          {
            field: 'utgafudagur',
            children: formatMessage(
              ritstjornTableMessages.columns.publishingDate,
            ),
          },
          {
            field: 'owner',
            children: formatMessage(ritstjornTableMessages.columns.owner),
          },
        ] as const
      }
      rows={rows}
    />
  )
}

export default AdvertsToBePublished
