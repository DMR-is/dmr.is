import { getServerSession } from 'next-auth'

import {
  fetchQueryWithHandler,
  HydrateClient,
  prefetch,
} from '@dmr.is/trpc/client/server'

import { authOptions } from '../../../lib/auth/authOptions'
import { trpc } from '../../../lib/trpc/client/server'
import { UsersPageClient } from './_components/UsersPageClient'

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  const isAdmin = session?.user?.role?.slug === 'ritstjori'

  const rolesData = await fetchQueryWithHandler(
    trpc.getRolesByUser.queryOptions(),
  )

  const roleOptions =
    rolesData?.roles?.map((role) => ({
      label: role.title,
      value: role,
    })) ?? []

  // Awaited: the consumers read these through `useQuery` and render
  // `data ?? []`, so streaming the page out first would server-render empty
  // tables and selects and hydrate populated ones. `retry: false` stops a dead
  // API holding the whole page back.
  await Promise.all([
    prefetch({
      ...trpc.getUsers.queryOptions({ page: 1, pageSize: 10 }),
      retry: false,
    }),
    prefetch({
      ...trpc.getInvolvedPartiesByUser.queryOptions(),
      retry: false,
    }),
  ])

  return (
    <HydrateClient>
      <UsersPageClient isAdmin={isAdmin} roleOptions={roleOptions} />
    </HydrateClient>
  )
}
