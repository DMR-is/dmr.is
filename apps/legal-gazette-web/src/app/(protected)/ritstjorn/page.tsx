import { PageContainer } from '../../../components/ritstjorn/PageContainer'
import {
  fetchQuery,
  trpc,
} from '../../../lib/trpc/client/server'
export default async function Ritstjorn() {
  const count = await fetchQuery(trpc.getAdvertsCount.queryOptions())

  return <PageContainer advertCount={count} />
}
