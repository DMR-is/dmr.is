'use client'

import { useIntl } from 'react-intl'

import { AlertMessage } from '@dmr.is/ui/components/island-is'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
import { formatDate } from '@dmr.is/utils/client'

import { Tag } from '@island.is/island-ui/core'

import { StatusEnum, StatusIdEnum } from '../../gen/fetch'
import { useFilterContext } from '../../hooks/useFilters'
import { ritstjornTableMessages } from '../../lib/messages/ritstjorn/tables'
import { useTRPC } from '../../lib/nTrpc/client/trpc'

import { useQuery } from '@tanstack/react-query'

export const AdvertsInProgress = () => {
  const { params, setParams } = useFilterContext()

  const { formatMessage } = useIntl()

  const trpc = useTRPC()
  const { data, isLoading, error } = useQuery(
    trpc.getSubmittedAdverts.queryOptions({
      categoryId: params.categoryId,
      typeId: params.typeId,
      statusId: params.statusId as StatusIdEnum[],
      search: params.search,
      page: params.page,
      pageSize: params.pageSize,
    }),
  )

  const rows = data?.adverts.map((advert) => ({
    birting: formatDate(advert.scheduledAt),
    skraning: formatDate(advert.createdAt),
    status: (
      <Tag
        variant={advert.status.title === StatusEnum.Innsent ? 'blue' : 'mint'}
      >
        {advert.status.title}
      </Tag>
    ),
    tegund: advert.type.title,
    efni: advert.title,
    owner: advert.createdBy,
    href: `/ritstjorn/${advert.id}`,
    hasLink: true,
  }))

  if (error) {
    return (
      <AlertMessage
        type="error"
        title="Villa kom upp"
        message="Ekki tókst að sækja auglýsingar í vinnslu"
      />
    )
  }

  return (
    <DataTable
      noDataMessage={formatMessage(
        ritstjornTableMessages.general.noDataMessage,
      )}
      loading={isLoading}
      layout="auto"
      columns={[
        {
          field: 'birting',
          children: formatMessage(ritstjornTableMessages.columns.scheduledAt),
          sortable: true,
          size: 'tiny',
        },
        {
          field: 'skraning',
          children: formatMessage(ritstjornTableMessages.columns.createdAt),
          size: 'tiny',
          sortable: true,
        },

        {
          field: 'status',
          children: formatMessage(ritstjornTableMessages.columns.status),
          size: 'tiny',
        },
        {
          field: 'tegund',
          children: formatMessage(ritstjornTableMessages.columns.type),
          size: 'tiny',
        },
        {
          field: 'efni',
          children: formatMessage(ritstjornTableMessages.columns.content),
        },
        {
          field: 'owner',
          children: formatMessage(ritstjornTableMessages.columns.owner),
        },
      ]}
      rows={rows}
      paging={data?.paging}
      onPageChange={(page) => setParams({ page: page })}
      onPageSizeChange={(pageSize) => setParams({ pageSize: pageSize })}
    />
  )
}

export default AdvertsInProgress
