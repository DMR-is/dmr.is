'use client'

import { useQueryStates } from 'nuqs'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import Hero from '@dmr.is/ui/components/Hero/Hero'
import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Select,
  Text,
  toast,
} from '@dmr.is/ui/components/island-is'

import { TBRTransactionStatus, TBRTransactionType } from '../gen/fetch'
import { PaymentsTable } from '../components/payments/PaymentsTable'
import { TRPCErrorAlert } from '../components/trpc/TRPCErrorAlert'
import { paymentsParams } from '../lib/nuqs/payments-params'
import { useTRPC } from '../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const typeOptions = [
  { label: 'Allar tegundir', value: '' },
  { label: 'Auglýsing', value: TBRTransactionType.ADVERT },
  { label: 'Áskrift', value: TBRTransactionType.SUBSCRIPTION },
]

const statusOptions = [
  { label: 'Allar stöður', value: '' },
  { label: 'Búið til', value: TBRTransactionStatus.CREATED },
  { label: 'Greitt', value: TBRTransactionStatus.PAID },
  { label: 'Misheppnað', value: TBRTransactionStatus.FAILED },
  { label: 'Í vinnslu', value: TBRTransactionStatus.PENDING },
]

const paidOptions = [
  { label: 'Allar greiðslur', value: '' },
  { label: 'Greitt', value: 'true' },
  { label: 'Ógreitt', value: 'false' },
]

export const PaymentsContainer = () => {
  const [params, setParams] = useQueryStates(paymentsParams)

  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data, isPending, error } = useQuery(
    trpc.getPayments.queryOptions({
      page: params.page,
      pageSize: params.pageSize,
      type: params.type ?? undefined,
      status: params.status ?? undefined,
      paid: params.paid ?? undefined,
    }),
  )

  const { mutate: syncPayments, isPending: isSyncing } = useMutation(
    trpc.syncPayments.mutationOptions({
      onSuccess: (result) => {
        if (result.updated > 0) {
          toast.success(
            `Samstilling lokið: ${result.updated} greiðslur uppfærðar`,
          )
        } else {
          toast.info('Engar nýjar greiðslur fundust')
        }
        queryClient.invalidateQueries(trpc.getPayments.queryFilter())
      },
      onError: () => {
        toast.error('Villa við samstillingu greiðslna')
      },
    }),
  )

  return (
    <GridContainer>
      <GridRow rowGap={[2, 3]} marginBottom={[2, 3]}>
        <GridColumn paddingTop={[2, 3]} span="12/12">
          <Hero
            title="Greiðslur"
            variant="small"
            image={{ src: '/assets/banner-small-image.svg', alt: '' }}
            centerImage={true}
            breadcrumbs={{
              items: [
                {
                  title: 'Stjórnborð',
                  href: '/',
                },
                {
                  title: 'Greiðslur',
                  href: '/greidslur',
                },
              ],
            }}
          >
            <Text>
              Hér er hægt að skoða allar greiðslur í kerfinu. Þetta sýnir stöðu
              TBR viðskipta fyrir auglýsingar og áskriftir.
            </Text>
          </Hero>
        </GridColumn>
        <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
          <Box marginBottom={3}>
            <GridRow rowGap={2}>
              <GridColumn span={['12/12', '6/12', '3/12']}>
                <Select
                  name="type"
                  label="Tegund"
                  size="sm"
                  options={typeOptions}
                  value={typeOptions.find((opt) => opt.value === (params.type ?? ''))}
                  onChange={(opt) =>
                    setParams({
                      type: opt?.value ? (opt.value as TBRTransactionType) : null,
                      page: 1,
                    })
                  }
                />
              </GridColumn>
              <GridColumn span={['12/12', '6/12', '3/12']}>
                <Select
                  name="status"
                  label="Staða TBR"
                  size="sm"
                  options={statusOptions}
                  value={statusOptions.find((opt) => opt.value === (params.status ?? ''))}
                  onChange={(opt) =>
                    setParams({
                      status: opt?.value ? (opt.value as TBRTransactionStatus) : null,
                      page: 1,
                    })
                  }
                />
              </GridColumn>
              <GridColumn span={['12/12', '6/12', '3/12']}>
                <Select
                  name="paid"
                  label="Greiðslustaða"
                  size="sm"
                  options={paidOptions}
                  value={paidOptions.find(
                    (opt) => opt.value === (params.paid === null ? '' : String(params.paid)),
                  )}
                  onChange={(opt) =>
                    setParams({
                      paid: opt?.value === '' ? null : opt?.value === 'true',
                      page: 1,
                    })
                  }
                />
              </GridColumn>
              <GridColumn span={['12/12', '6/12', '3/12']}>
                <Box display="flex" alignItems="flexEnd" height="full">
                  <Inline space={2}>
                    <Button
                      variant="ghost"
                      size="small"
                      icon="reload"
                      loading={isSyncing}
                      onClick={() => syncPayments()}
                    >
                      Samstilla við TBR
                    </Button>
                  </Inline>
                </Box>
              </GridColumn>
            </GridRow>
          </Box>
          {error && <TRPCErrorAlert error={error} />}
          <PaymentsTable
            loading={isPending}
            payments={data?.payments}
            paging={data?.paging}
            onPageChange={(page) =>
              setParams((prev) => ({ ...prev, page: page }))
            }
            onPageSizeChange={(pageSize) =>
              setParams((prev) => ({ ...prev, pageSize }))
            }
          />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
