import { ApplicationsContainer } from '../../../containers/ApplicationsContainer'
import { loadPagingSearchParams } from '../../../lib/nuqs/search-params'
import { getTrpcServer } from '../../../lib/trpc/server/server'

export default async function UmsoknirPage({
  searchParams,
}: {
  searchParams: { page?: string; pageSize?: string }
}) {
  const { page, pageSize } = loadPagingSearchParams(searchParams)

  const { trpc, HydrateClient } = await getTrpcServer()

  void trpc.applicationApi.getApplications.prefetch({ page, pageSize })

  return (
    <HydrateClient>
      <ApplicationsContainer searchParams={{ page, pageSize }} />
    </HydrateClient>
  )
}
