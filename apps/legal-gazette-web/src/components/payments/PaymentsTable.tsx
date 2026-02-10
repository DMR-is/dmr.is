'use client'

import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
import { DataTableColumnProps } from '@dmr.is/ui/components/Tables/DataTable/types'
import { formatDate } from '@dmr.is/utils/shared/format/date'

import {
  Paging,
  PaymentDto,
  TBRGetPaymentResponseDto,
  TBRTransactionStatus,
  TBRTransactionType,
} from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation } from '@tanstack/react-query'

type Props = {
  payments?: PaymentDto[]
  paging?: Paging
  loading?: boolean
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

const mapTBRStatus = (
  status: TBRTransactionStatus,
): { title: string; variant: React.ComponentProps<typeof Tag>['variant'] } => {
  switch (status) {
    case TBRTransactionStatus.CREATED:
      return { title: 'Búið til', variant: 'blue' }
    case TBRTransactionStatus.PAID:
      return { title: 'Greitt', variant: 'mint' }
    case TBRTransactionStatus.CANCELED:
      return { title: 'Hætt við', variant: 'disabled' }
    case TBRTransactionStatus.FAILED:
      return { title: 'Misheppnað', variant: 'red' }
    case TBRTransactionStatus.PENDING:
      return { title: 'Í vinnslu', variant: 'yellow' }
    default:
      return { title: 'Óþekkt staða', variant: 'rose' }
  }
}

const mapTransactionType = (type: TBRTransactionType): string => {
  switch (type) {
    case TBRTransactionType.ADVERT:
      return 'Auglýsing'
    case TBRTransactionType.SUBSCRIPTION:
      return 'Áskrift'
    default:
      return 'Óþekkt'
  }
}

type PaymentDetailsProps = {
  payment: PaymentDto
}

const PaymentDetails = ({ payment }: PaymentDetailsProps) => {
  const trpc = useTRPC()

  const { mutate: getPayment, isPending: isGettingPayment } = useMutation(
    trpc.getPaymentByTransactionId.mutationOptions({
      onSuccess: (payment) => {
        setCurrentPayment(payment)
        setVisible(true)
      },
      onError: () => {
        toast.error('Villa við að sækja greiðslu eftir viðskiptanúmeri')
      },
    }),
  )

  const [visible, setVisible] = useState(false)
  const [currentPayment, setCurrentPayment] =
    useState<TBRGetPaymentResponseDto | null>(null)

  const handleVisibilityChange = (isVisible: boolean) => {
    if (isVisible === false) {
      setCurrentPayment(null)
    }

    setVisible(isVisible)
  }

  return (
    <Box padding={2} background="blue100" borderRadius="standard">
      <Modal
        baseId="payment-info"
        isVisible={visible}
        onVisibilityChange={handleVisibilityChange}
        title="Greiðslustaða í TBR"
      >
        {currentPayment ? (
          <Stack space={[2, 3]}>
            <Text>Eftirstöðvar: {currentPayment.capital}</Text>
            <Text>Til í TBR: {currentPayment.created ? 'Já' : 'Nei'}</Text>
            <Text>Greitt: {currentPayment.paid ? 'Já' : 'Nei'}</Text>
            <Text>Felld niður: {currentPayment.canceled ? 'Já' : 'Nei'}</Text>
          </Stack>
        ) : (
          <Text>Engin greiðslustaða í boði</Text>
        )}
      </Modal>
      <GridRow rowGap={2}>
        <GridColumn span={['12/12', '6/12', '3/12']}>
          <Text variant="eyebrow">Búið til</Text>
          <Text>
            {formatDate(new Date(payment.createdAt), "d.MM.yy 'kl.' HH:mm")}
          </Text>
        </GridColumn>
        <GridColumn span={['12/12', '6/12', '3/12']}>
          <Text variant="eyebrow">Gjaldgrunnur</Text>
          <Text>{payment.chargeBase || '-'}</Text>
        </GridColumn>
        <GridColumn span={['12/12', '6/12', '3/12']}>
          <Text variant="eyebrow">Gjaldflokkur</Text>
          <Text>{payment.chargeCategory || '-'}</Text>
        </GridColumn>
        <GridColumn span={['12/12', '6/12', '3/12']}>
          <Button
            icon="cardWithCheckmark"
            iconType="outline"
            variant="utility"
            size="small"
            onClick={() => getPayment({ transactionId: payment.id })}
            loading={isGettingPayment}
          >
            Sækja greiðslustöðu
          </Button>
        </GridColumn>
        {payment.tbrError && (
          <GridColumn span="12/12">
            <Text variant="eyebrow">Villa frá TBR</Text>
            <Box marginTop={1}>
              <Tag variant="red">{payment.tbrError}</Tag>
            </Box>
          </GridColumn>
        )}
      </GridRow>
    </Box>
  )
}

export const PaymentsTable = ({
  payments,
  paging,
  loading,
  onPageChange,
  onPageSizeChange,
}: Props) => {
  const columns: DataTableColumnProps[] = [
    {
      field: 'debtorNationalId',
      children: 'Kennitala skuldara',
      size: 'tiny',
    },
    {
      field: 'type',
      children: 'Tegund',
      size: 'tiny',
    },
    {
      field: 'totalPrice',
      children: 'Heildarverð',
      size: 'tiny',
    },
    {
      field: 'paidAt',
      children: 'Greitt',
      size: 'tiny',
    },
    {
      field: 'status',
      children: 'Staða TBR',
      size: 'tiny',
    },
  ]

  const rows = payments?.map((payment) => {
    const mappedStatus = mapTBRStatus(payment.status)
    return {
      debtorNationalId: <Text variant="small">{payment.debtorNationalId}</Text>,
      type: mapTransactionType(payment.type),
      totalPrice: payment.totalPrice.toLocaleString('is-IS') + ' kr.',
      paidAt: payment.paidAt ? (
        formatDate(new Date(payment.paidAt), "d.MM.yy 'kl.' HH:mm")
      ) : (
        <Tag disabled variant="red">
          Ógreitt
        </Tag>
      ),
      status: <Tag variant={mappedStatus.variant}>{mappedStatus.title}</Tag>,
      isExpandable: true,
      children: <PaymentDetails payment={payment} />,
    }
  })

  return (
    <DataTable
      columns={columns}
      rows={rows}
      paging={paging}
      noDataMessage="Engar greiðslur fundust"
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      loading={loading}
    />
  )
}
