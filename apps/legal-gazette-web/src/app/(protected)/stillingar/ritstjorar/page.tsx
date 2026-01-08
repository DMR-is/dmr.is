import { HydrateClient, prefetch } from '@dmr.is/trpc/client/server'

import { UsersContainer } from '../../../../containers/UsersContainer'
import { pagingParamsCache } from '../../../../lib/nuqs/paging-params'
import { trpc } from '../../../../lib/trpc/client/server'

type Props = {
  searchParams: Record<string, string>
}

export default async function UserSettingsPage({ searchParams }: Props) {
  const { page, pageSize } = pagingParamsCache.parse(searchParams)

  prefetch(trpc.getUsers.queryOptions({ page, pageSize }))

  return (
    <HydrateClient>
      <UsersContainer />
    </HydrateClient>
  )
}
