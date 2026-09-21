import { HydrateClient, prefetch } from '@dmr.is/trpc/client/server'

import { PageContainer } from '../../../components/ritstjorn/PageContainer'
import { trpc } from '../../../lib/trpc/client/server'

export default async function Ritstjorn() {
  // Unawaited on purpose: `PageContainer` reads this through
  // `useSuspenseQuery`, which is the pattern streaming prefetch is built for.
  prefetch(trpc.getStatuses.queryOptions())

  return (
    <HydrateClient>
      <PageContainer />
    </HydrateClient>
  )
}
