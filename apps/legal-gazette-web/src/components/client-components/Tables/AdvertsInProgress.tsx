'use client'

import { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'

import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { Tag } from '@island.is/island-ui/core'

import { getAdvertsInProgress } from '../../../actions/adverts'
import { GetAdvertsDto, StatusEnum, StatusIdEnum } from '../../../gen/fetch'
import { useFilterContext } from '../../../hooks/useFilters'
import { ritstjornTableMessages } from '../../../lib/messages/ritstjorn/tables'
import { formatDate } from '../../../lib/utils'

export const AdvertsInProgress = () => {
  const { params, setParams } = useFilterContext()

  const { formatMessage } = useIntl()

  const [data, setData] = useState<GetAdvertsDto>()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAdvertsInProgress({
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
        categoryId: params.categoryId,
        statusId: [StatusIdEnum.SUBMITTED],
        typeId: params.typeId,
        dateFrom: params.dateFrom?.toISOString(),
        dateTo: params.dateTo?.toISOString(),
      })

      setData(data)
      setIsLoading(false)
    }

    setIsLoading(true)
    fetchData()
  }, [params])

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

  // if (error) {
  //   return (
  //     <AlertMessage
  //       type="error"
  //       title="Villa kom upp"
  //       message="Ekki tókst að sækja auglýsingar í vinnslu"
  //     />
  //   )
  // }

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
