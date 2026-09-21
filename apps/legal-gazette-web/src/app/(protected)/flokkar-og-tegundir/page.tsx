import { HydrateClient, prefetch } from '@dmr.is/trpc/client/server'

import { CategoryTypeContainer } from '../../../containers/CategoryTypeContainer'
import { trpc } from '../../../lib/trpc/client/server'

export default async function CategoryTypePage() {
  // Awaited on purpose: the container reads this through `useQuery` and renders
  // a skeleton while it is pending, so streaming the page out first would leave
  // the server on the skeleton branch and the client on the loaded one.
  //
  // The change log is deliberately not prefetched. It is keyed by the filters
  // the container owns, and it renders timestamps through the local timezone,
  // which server-rendering would turn into a fresh mismatch off GMT.
  await prefetch({
    ...trpc.getCategoryTypeOverview.queryOptions(),
    // Bounds the wait a dead API would otherwise impose on the whole page.
    // The client refetches and surfaces the error either way.
    retry: false,
  })

  return (
    <HydrateClient>
      <CategoryTypeContainer />
    </HydrateClient>
  )
}
