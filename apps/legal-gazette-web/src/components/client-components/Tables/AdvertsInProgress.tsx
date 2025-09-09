'use client'

import { useSession } from 'next-auth/react'

import { useIntl } from 'react-intl'
import useSWR from 'swr'

import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { AlertMessage, SkeletonLoader } from '@island.is/island-ui/core'

import { useFilters } from '../../../hooks/useFilters'
import { getLegalGazetteClient } from '../../../lib/api/createClient'
import { ritstjornTableMessages } from '../../../lib/messages/ritstjorn/tables'
import { formatDate } from '../../../lib/utils'

export const AdvertsInProgress = () => {
  const { params, setParams } = useFilters()

  const { formatMessage } = useIntl()

  const session = useSession()

  if (!session.data?.idToken) {
    throw new Error('Unauthorized')
  }

  const client = getLegalGazetteClient('AdvertApi', session.data.idToken)

  const { data, isLoading, error } = useSWR(
    ['getAdverts', params],
    ([_key, params]) =>
      client.getAdvertsInProgress({
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
        categoryId: params.categoryId || undefined,
        typeId: params.typeId || undefined,
        dateFrom: params.dateFrom?.toISOString(),
        dateTo: params.dateTo?.toISOString(),
      }),
    {
      keepPreviousData: true,
    },
  )

  const rows = data?.adverts.map((advert) => ({
    birting: formatDate(advert.scheduledAt),
    skraning: formatDate(advert.createdAt),
    tegund: advert.type.title,
    efni: advert.title,
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

  if (isLoading) {
    return (
      <SkeletonLoader
        repeat={5}
        height={44}
        space={[1, 2]}
        borderRadius="large"
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
          field: 'tegund',
          children: formatMessage(ritstjornTableMessages.columns.type),
          size: 'tiny',
        },
        {
          field: 'efni',
          children: formatMessage(ritstjornTableMessages.columns.content),
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
