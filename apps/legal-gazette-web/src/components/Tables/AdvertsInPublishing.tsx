'use client'

import { useIntl } from 'react-intl'

import { Text } from '@dmr.is/ui/components/island-is'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
import { formatDate } from '@dmr.is/utils/client'

import { useFilterContext } from '../../hooks/useFilters'
import { ritstjornTableMessages } from '../../lib/messages/ritstjorn/tables'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useQuery } from '@tanstack/react-query'

export const AdvertsInPublishing = () => {
  const { formatMessage } = useIntl()
  const { params, setParams } = useFilterContext()
  const trpc = useTRPC()

  const { data } = useQuery(
    trpc.getInPublishingAdverts.queryOptions({
      categoryId: params.categoryId,
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      typeId: params.typeId,
      direction: params.direction ?? undefined,
      sortBy: params.sortBy ?? undefined,
    }),
  )

  const columns = [
    {
      field: 'lastPublished',
      children: 'Siðast birt',
      size: 'small' as const,
    },
    {
      field: 'scheduledAt',
      children: 'Næsta birting',
    },
    {
      field: 'tegund',
      children: formatMessage(ritstjornTableMessages.columns.category),
      size: 'tiny' as const,
    },
    {
      field: 'efni',
      children: formatMessage(ritstjornTableMessages.columns.content),
    },
    {
      field: 'sender',
      children: formatMessage(ritstjornTableMessages.columns.sender),
      size: 'tiny' as const,
    },

    {
      field: 'owner',
      children: formatMessage(ritstjornTableMessages.columns.owner),
      size: 'tiny' as const,
    },
  ]

  const rows = data?.adverts.map((advert) => ({
    lastPublished: advert.lastPublishedAt ? (
      <Text variant="medium" whiteSpace="nowrap">
        {formatDate(advert.lastPublishedAt, 'dd.MM.yyyy')}
      </Text>
    ) : (
      'Enginn fyrri birting'
    ),
    scheduledAt: advert.scheduledAt ? (
      <Text variant="medium" whiteSpace="nowrap">
        {formatDate(advert.scheduledAt, 'dd.MM.yyyy')}
      </Text>
    ) : (
      'Engin útgáfudagsetning skráð'
    ),
    tegund: advert.type.title,
    efni: advert.title,
    sender: advert.createdBy,
    owner: advert.assignedUser?.name,
    href: `/ritstjorn/${advert.id}`,
    hasLink: true,
    openLinkInNewTab: true,
  }))

  return (
    <DataTable
      columns={columns}
      rows={rows}
      paging={data?.paging}
      onPageChange={(page) => setParams({ page: page })}
      onPageSizeChange={(pageSize) => setParams({ pageSize: pageSize })}
      showPageSizeSelect={true}
    />
  )
}
