'use client'

import { useIntl } from 'react-intl'

import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
import { formatDate } from '@dmr.is/utils/client'

import { Checkbox } from '@island.is/island-ui/core'

import { useFilterContext } from '../../hooks/useFilters'
import { ritstjornTableMessages } from '../../lib/messages/ritstjorn/tables'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useQuery } from '@tanstack/react-query'

type Props = {
  selectedAdvertIds?: string[]
  onToggle?: (advertId: string) => void
}

export const AdvertsToBePublished = ({
  selectedAdvertIds = [],
  onToggle,
}: Props) => {
  const { formatMessage } = useIntl()
  const { params, setParams } = useFilterContext()
  const trpc = useTRPC()

  const { data } = useQuery(
    trpc.getReadyForPublicationAdverts.queryOptions({
      categoryId: params.categoryId,
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      typeId: params.typeId,
    }),
  )

  const rows = data?.adverts.map((advert) => ({
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
      paging={data?.paging}
      onPageChange={(page) => setParams({ page: page })}
      onPageSizeChange={(pageSize) => setParams({ pageSize: pageSize })}
      showPageSizeSelect={true}
    />
  )
}

export default AdvertsToBePublished
