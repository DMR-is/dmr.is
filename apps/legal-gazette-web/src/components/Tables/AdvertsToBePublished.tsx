import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { Checkbox, Tag } from '@island.is/island-ui/core'

import { AdvertDto } from '../../gen/fetch'
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
        {advert.paid ? 'Greitt' : 'Beðið eftir greiðslu'}
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
      noDataMessage="Engar auglýsingar tilbúnar til útgáfu"
      columns={
        [
          {
            field: 'checkbox',
            children: '',
            size: 'tiny',
          },
          {
            field: 'flokkur',
            children: 'Flokkur',
            size: 'small',
          },
          {
            field: 'greitt',
            children: 'Staða greiðslu',
            size: 'small',
          },
          {
            field: 'efni',
            children: 'Efni',
          },
          {
            field: 'utgafudagur',
            children: 'Útgáfudagur',
            size: 'small',
          },
          {
            field: 'utgafunumer',
            children: 'Útgáfunúmer',
            size: 'small',
          },
          {
            field: 'utgafuTegund',
            children: 'Birting',
            size: 'small',
            align: 'center',
          },
          {
            field: 'owner',
            children: 'Eigandi',
            size: 'small',
          },
        ] as const
      }
      rows={rows}
    />
  )
}

export default AdvertsToBePublished
