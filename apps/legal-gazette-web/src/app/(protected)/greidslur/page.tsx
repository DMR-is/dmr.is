import { HydrateClient, prefetch } from '@dmr.is/trpc/client/server'

import { PaymentsContainer } from '../../../containers/PaymentsContainer'
import { pagingParamsCache } from '../../../lib/nuqs/paging-params'
import { trpc } from '../../../lib/trpc/client/server'

type Props = {
  searchParams: Promise<Record<string, string>>
}

export default async function PaymentsPage({ searchParams }: Props) {
  const { page, pageSize } = pagingParamsCache.parse(await searchParams)

  // Awaited: the container reads this through `useQuery` and renders a
  // DataTable skeleton while it is pending, so streaming the page out first
  // would leave the server on the skeleton and the client on the loaded table.
  // `retry: false` stops a dead API holding the whole page back.
  await prefetch({
    ...trpc.getPayments.queryOptions({ page, pageSize }),
    retry: false,
  })

  return (
    <HydrateClient>
      <PaymentsContainer />
    </HydrateClient>
  )
}
