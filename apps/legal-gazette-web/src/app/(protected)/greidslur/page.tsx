import { fetchQuery } from '@dmr.is/trpc/client/server'

import { PaymentsContainer } from '../../../containers/PaymentsContainer'
import { loadSearchParams } from '../../../lib/nuqs/search-params'
import { trpc } from '../../../lib/trpc/client/server'

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Record<string, string>
}) {
  const payments = await fetchQuery(trpc.getPayments.queryOptions())

  const params = await loadSearchParams(searchParams)

  return <PaymentsContainer payments={payments} initialParams={params} />
}
