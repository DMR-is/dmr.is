'use client'

import { useQueryStates } from 'nuqs'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import Hero from '@dmr.is/ui/components/Hero/Hero'
import {
  GridColumn,
  GridContainer,
  GridRow,
  Text,
} from '@dmr.is/ui/components/island-is'

import { PaymentsTable } from '../components/payments/PaymentsTable'
import { TRPCErrorAlert } from '../components/trpc/TRPCErrorAlert'
import { pagingParams } from '../lib/nuqs/paging-params'
import { useTRPC } from '../lib/trpc/client/trpc'

export const PaymentsContainer = () => {
  const [params, setParams] = useQueryStates(pagingParams)

  const trpc = useTRPC()

  const { data, isPending, error } = useQuery(
    trpc.getPayments.queryOptions(params),
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
