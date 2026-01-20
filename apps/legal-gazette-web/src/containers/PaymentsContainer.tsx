'use client'

import { useQueryStates } from 'nuqs'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import {
  GridColumn,
  GridContainer,
  GridRow,
  Tag,
  Text,
} from '@dmr.is/ui/components/island-is'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
import { formatDate } from '@dmr.is/utils/client'

import {
  GetPaymentsDto,
  TBRTransactionStatus,
  TBRTransactionType,
} from '../gen/fetch'
import { loadSearchParams, serverSearchParams } from '../lib/nuqs/search-params'
import { useTRPC } from '../lib/trpc/client/trpc'

import { useQueryClient } from '@tanstack/react-query'

type Props = {
  payments: GetPaymentsDto
  initialParams: Awaited<ReturnType<typeof loadSearchParams>>
}

const mapTRPStatus = (
  status: TBRTransactionStatus,
): { title: string; variant: React.ComponentProps<typeof Tag>['variant'] } => {
  switch (status) {
    case TBRTransactionStatus.CREATED:
      return { title: 'Búið til', variant: 'blue' }
    case TBRTransactionStatus.PAID:
      return { title: 'Greitt', variant: 'mint' }
    case TBRTransactionStatus.FAILED:
      return { title: 'Misheppnað', variant: 'red' }
    case TBRTransactionStatus.PENDING:
      return { title: 'Í vinnslu', variant: 'yellow' }
    default:
      return { title: 'Óþekkt staða', variant: 'rose' }
  }
}

export const PaymentsContainer = ({ payments, initialParams }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [params, setParams] = useQueryStates(serverSearchParams, {
    shallow: false,
  })

  const { data, isPending } = useQuery(
    trpc.getPayments.queryOptions(undefined, { initialData: payments }),
  )

  const columns = [
    {
      field: 'debtorNationalId',
      children: 'Kennitala skuldara',
    },
    {
      field: 'type',
      children: 'Tegund',
    },
    {
      field: 'status',
      children: 'Staða TBR',
    },
    {
      field: 'totalPrice',
      children: 'Heildarverð',
    },
    {
      field: 'paidAt',
      children: 'Greitt',
    },
    {
      field: 'createdAt',
      children: 'Búið til',
    },
    {
      field: 'chargeBase',
      children: 'Gjaldgrunnur',
    },
    {
      field: 'chargeCategory',
      children: 'Gjaldflokkur',
    },
    {
      field: 'tbrReference',
      children: 'Tilvísun TBR',
    },
    {
      field: 'tbrError',
      children: 'Villa frá TBR',
    },
  ]

  const rows =
    data?.payments.map((p) => {
      const mappedStatus = mapTRPStatus(p.status)
      return {
        debtorNationalId: <Text variant="small">{p.debtorNationalId}</Text>,
        type: p.type === TBRTransactionType.ADVERT ? 'Auglýsing' : 'Áskrift',
        status: <Tag variant={mappedStatus.variant}>{mappedStatus.title}</Tag>,
        totalPrice: p.totalPrice,
        paidAt: p.paidAt ? (
          formatDate(new Date(p.paidAt), "d.MM.yy 'kl.' HH:mm")
        ) : (
          <Tag disabled variant="red">
            Ógreitt
          </Tag>
        ),
        createdAt: formatDate(new Date(p.createdAt), "d.MM.yy 'kl.' HH:mm"),
        chargeBase: p.chargeBase,
        chargeCategory: p.chargeCategory,
        tbrReference: p.tbrReference,
        tbrError: p.tbrError,
      }
    }) || []

  return (
    <GridContainer>
      <GridRow>
        <GridColumn span="12/12">
          <DataTable
            columns={columns}
            rows={rows}
            loading={isPending}
            paging={data?.paging}
            onPageChange={(page) => setParams({ page })}
            onPageSizeChange={(pageSize) => setParams({ pageSize })}
          />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
