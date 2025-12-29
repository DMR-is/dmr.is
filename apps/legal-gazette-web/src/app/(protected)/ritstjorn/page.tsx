import { fetchQuery, HydrateClient, prefetch } from '@dmr.is/trpc/client/server'

import { PageContainer } from '../../../components/ritstjorn/PageContainer'
import { trpc } from '../../../lib/trpc/client/server'
export default async function Ritstjorn() {
  prefetch(trpc.getStatuses.queryOptions())
  const count = await fetchQuery(trpc.getAdvertsCount.queryOptions())

  return (
    <HydrateClient>
      <PageContainer advertCount={count} />
    </HydrateClient>
  )
}
