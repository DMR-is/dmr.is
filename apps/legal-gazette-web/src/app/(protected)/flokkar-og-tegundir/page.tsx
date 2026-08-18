import { HydrateClient, prefetch } from '@dmr.is/trpc/client/server'

import { CategoryTypeContainer } from '../../../containers/CategoryTypeContainer'
import { trpc } from '../../../lib/trpc/client/server'

export default async function CategoryTypePage() {
  prefetch(trpc.getCategoryTypeOverview.queryOptions())
  prefetch(trpc.getCategoryTypeChangeLog.queryOptions({}))

  return (
    <HydrateClient>
      <CategoryTypeContainer />
    </HydrateClient>
  )
}
