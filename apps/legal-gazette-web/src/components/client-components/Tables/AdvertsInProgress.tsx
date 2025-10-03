'use client'

import { useIntl } from 'react-intl'
import useSWR from 'swr'

import { AlertMessage } from '@dmr.is/ui/components/island-is'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
import { formatDate } from '@dmr.is/utils/client'

import { Tag } from '@island.is/island-ui/core'

import { GetAdvertsDto, StatusEnum } from '../../../gen/fetch'
import { useFilterContext } from '../../../hooks/useFilters'
import { ritstjornTableMessages } from '../../../lib/messages/ritstjorn/tables'
import { trpc } from '../../../lib/trpc/client'

export const AdvertsInProgress = () => {
  const { params, setParams } = useFilterContext()

  const { formatMessage } = useIntl()

  const {data: x} = trpc.getAdverts.useQuery()
  const {data: y} = trpc.getTest.useQuery()

  console.log(x)
  console.log(y)

  const { data, isLoading, error } = useSWR<GetAdvertsDto>(
    ['api/adverts/in-progress', params],
    ([key, params]: [string, Record<string, any>]) => {
      const filtered = Object.entries(params).filter(
        ([_, v]) =>
          v != null && v !== '' && !(Array.isArray(v) && v.length === 0),
      )
      const urlSearchParams = new URLSearchParams(
        filtered as unknown as Record<string, string>,
      )
      return fetch(`${key}?${urlSearchParams.toString()}`).then((res) =>
        res.json(),
      )
    },
    {
      keepPreviousData: true,
      errorRetryCount: 3,
      revalidateOnFocus: true,
      dedupingInterval: 60000,
    },
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
      ]}
      rows={rows}
      paging={data?.paging}
      onPageChange={(page) => setParams({ page: page })}
      onPageSizeChange={(pageSize) => setParams({ pageSize: pageSize })}
    />
  )
}

export default AdvertsInProgress
