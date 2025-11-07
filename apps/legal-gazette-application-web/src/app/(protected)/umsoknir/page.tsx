import { ApplicationsContainer } from '../../../containers/ApplicationsContainer'
import { loadPagingSearchParams } from '../../../lib/nuqs/search-params'

export default async function UmsoknirPage({
  searchParams,
}: {
  searchParams: { page?: string; pageSize?: string }
}) {
  const { page, pageSize } = loadPagingSearchParams(searchParams)

  return <ApplicationsContainer searchParams={{ page, pageSize }} />
}
