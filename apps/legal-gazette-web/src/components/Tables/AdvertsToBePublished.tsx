'use client'

import { useIntl } from 'react-intl'

import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
import { formatDate } from '@dmr.is/utils/client'

import { Checkbox } from '@island.is/island-ui/core'

import { AdvertDto } from '../../gen/fetch'
import { ritstjornTableMessages } from '../../lib/messages/ritstjorn/tables'

type Props = {
  selectedAdvertIds?: string[]
  onToggle?: (advertId: string) => void
  adverts?: AdvertDto[]
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
    sender: advert.createdBy,
    owner: advert.assignedUser?.name,
    href: `/ritstjorn/${advert.id}`,
    hasLink: true,
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
          {
            field: 'sender',
            children: formatMessage(ritstjornTableMessages.columns.sender),
          },
        ] as const
      }
      rows={rows}
    />
  )
}

export default AdvertsToBePublished
