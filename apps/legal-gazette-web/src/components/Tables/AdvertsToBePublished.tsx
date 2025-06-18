import { useIntl } from 'react-intl'

import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { Checkbox, Tag } from '@island.is/island-ui/core'

import { AdvertDto } from '../../gen/fetch'
import { messages } from '../../lib/messages/messages'
import { ritstjornTables } from '../../lib/messages/ritstjorn/tables'
import { formatDate } from '../../lib/utils'

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
        disabled={!advert.paid}
        onChange={() => onToggle?.(advert.id)}
      />
    ),
    flokkur: advert.category.title,
    greitt: (
      <Tag variant={advert.paid ? 'mint' : 'rose'}>
        {formatMessage(
          advert.paid ? messages.paymentCompleted : messages.waitingForPayment,
        )}
      </Tag>
    ),
    efni: advert.title,
    utgafudagur: formatDate(advert.scheduledAt),
    utgafunumer: advert.publicationNumber,
    utgafuTegund: advert.version,
    owner: advert.owner,
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
            children: formatMessage(ritstjornTables.columns.category),
            size: 'small',
          },
          {
            field: 'greitt',
            children: formatMessage(ritstjornTables.columns.paymentStatus),
            size: 'small',
          },
          {
            field: 'efni',
            children: formatMessage(ritstjornTables.columns.content),
          },
          {
            field: 'utgafudagur',
            children: formatMessage(ritstjornTables.columns.publishingDate),
            size: 'small',
          },
          {
            field: 'utgafunumer',
            children: formatMessage(ritstjornTables.columns.publishingNumber),
            size: 'small',
          },
          {
            field: 'utgafuTegund',
            children: formatMessage(ritstjornTables.columns.version),
            size: 'small',
            align: 'center',
          },
          {
            field: 'owner',
            children: formatMessage(ritstjornTables.columns.owner),
            size: 'small',
          },
        ] as const
      }
      rows={rows}
    />
  )
}

export default AdvertsToBePublished
