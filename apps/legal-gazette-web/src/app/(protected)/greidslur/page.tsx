import { HydrateClient, prefetch } from '@dmr.is/trpc/client/server'

import { PaymentsContainer } from '../../../containers/PaymentsContainer'
import { paymentsParamsCache } from '../../../lib/nuqs/payments-params'
import { trpc } from '../../../lib/trpc/client/server'

type Props = {
  searchParams: Promise<Record<string, string>>
}

export default async function PaymentsPage({ searchParams }: Props) {
  // Parsed with the payments cache, not the plain paging one: the container
  // keys this query on the filters too (`PaymentsContainer.tsx:52-60`), so
  // prefetching page/pageSize alone would miss on any filtered URL - and now
  // that it is awaited, a missed key costs the user a blocking fetch whose
  // result is then thrown away.
  const { page, pageSize, type, status, paid } = paymentsParamsCache.parse(
    await searchParams,
  )

  // Awaited: the container reads this through `useQuery` and renders a
  // DataTable skeleton while it is pending, so streaming the page out first
  // would leave the server on the skeleton and the client on the loaded table.
  // `retry: false` stops a dead API holding the whole page back.
  await prefetch({
    ...trpc.getPayments.queryOptions({
      page,
      pageSize,
      type: type ?? undefined,
      status: status ?? undefined,
      paid: paid ?? undefined,
    }),
    retry: false,
  })

  return (
    <HydrateClient>
      <PaymentsContainer />
    </HydrateClient>
  )
}
