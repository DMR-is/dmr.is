'use client'

import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
import { DataTableColumnProps } from '@dmr.is/ui/components/Tables/DataTable/types'
import { formatDate } from '@dmr.is/utils/client'

import { AdvertDto } from '../../gen/fetch'
import { DateFormats } from '../../lib/constants'
import { AdvertPublications } from './AdvertPublications'

type Props = {
  adverts: AdvertDto[]
}

export const AdvertTable = ({ adverts }: Props) => {
  const columns: DataTableColumnProps[] = [
    {
      field: 'createdAt',
      children: 'Skráning',
      size: 'tiny',
    },
    {
      field: 'category',
      children: 'Flokkur',
      size: 'tiny',
    },
    {
      field: 'type',
      children: 'Tegund',
      size: 'tiny',
    },
    {
      field: 'title',
      children: 'Efni',
    },
  ]

  return (
    <DataTable
      noDataMessage="Engar auglýsingar fundust"
      columns={columns}
      rows={adverts.map((ad, index) => ({
        createdAt: formatDate(ad.createdAt, DateFormats.DEFAULT),
        category: ad.category.title,
        type: ad.type.title,
        title: ad.title,
        children: <AdvertPublications advert={ad} />,
        isExpandable: true,
        startExpanded: index === adverts.length - 1,
      }))}
    />
  )
}
