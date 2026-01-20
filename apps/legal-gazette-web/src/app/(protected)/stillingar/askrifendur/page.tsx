import { HydrateClient, prefetch } from '@dmr.is/trpc/client/server'

import { SubscribersContainer } from '../../../../containers/SubscribersContainer'
import { pagingParamsCache } from '../../../../lib/nuqs/paging-params'
import { trpc } from '../../../../lib/trpc/client/server'

type Props = {
  searchParams: Record<string, string>
}

export default async function SubscribersSettingsPage({ searchParams }: Props) {
  const { page, pageSize } = pagingParamsCache.parse(searchParams)

  prefetch(
    trpc.getSubscribers.queryOptions({
      page,
      pageSize,
      includeInactive: false,
    }),
  )

  return (
    <HydrateClient>
      <SubscribersContainer />
    </HydrateClient>
  )
}
