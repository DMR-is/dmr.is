import { getServerSession } from 'next-auth'

import {
  fetchQueryWithHandler,
  HydrateClient,
  prefetch,
} from '@dmr.is/trpc/client/server'

import { authOptions } from '../../../lib/auth/authOptions'
import { usersParamsCache } from '../../../lib/nuqs/users-params'
import { trpc } from '../../../lib/trpc/client/server'
import { UsersPageClient } from './_components/UsersPageClient'

type Props = {
  searchParams: Promise<Record<string, string>>
}

export default async function UsersPage({ searchParams }: Props) {
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

  // Parsed from the URL rather than hardcoded: `UserProvider` keys this query
  // on all five values (`userContext.tsx:77-92`). A hardcoded page 1 hashes
  // equal only on a bare URL, so on `?page=2` or `?leit=jon` the page would
  // block on a fetch the container then discards - leaving the user waiting
  // longer for the same empty first paint this PR removes.
  const { page, pageSize, stofnun, hlutverk, leit } = usersParamsCache.parse(
    await searchParams,
  )

  // Awaited: the consumers read these through `useQuery` and render
  // `data ?? []`, so streaming the page out first would server-render empty
  // tables and selects and hydrate populated ones. `retry: false` stops a dead
  // API holding the whole page back.
  await Promise.all([
    prefetch({
      ...trpc.getUsers.queryOptions({
        page,
        pageSize,
        role: hlutverk ?? undefined,
        involvedParty: stofnun ?? undefined,
        search: leit ?? undefined,
      }),
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
