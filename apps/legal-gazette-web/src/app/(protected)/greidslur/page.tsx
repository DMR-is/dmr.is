import { HydrateClient, prefetch } from '@dmr.is/trpc/client/server'

import { PaymentsContainer } from '../../../containers/PaymentsContainer'
import { pagingParamsCache } from '../../../lib/nuqs/paging-params'
import { trpc } from '../../../lib/trpc/client/server'

type Props = {
  searchParams: Record<string, string>
}

export default async function PaymentsPage({ searchParams }: Props) {
  const { page, pageSize } = pagingParamsCache.parse(searchParams)

  prefetch(trpc.getPayments.queryOptions({ page, pageSize }))

  return (
    <HydrateClient>
      <PaymentsContainer />
    </HydrateClient>
  )
}
