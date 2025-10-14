import { PageContainer } from '../../../components/ritstjorn/PageContainer'
import { getTrpcServer } from '../../../lib/trpc/server/server'

export default async function Ritstjorn() {
  const { trpc } = await getTrpcServer()

  const count = await trpc.adverts.getAdvertsCount()

  return <PageContainer advertCount={count} />
}
