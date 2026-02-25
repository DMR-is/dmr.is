import { HydrateClient, prefetch } from '@dmr.is/trpc/client/server'

import IssuesContainer from '../../../containers/IssuesContainer'
import { trpc } from '../../../lib/trpc/client/server'

export default function IssuesPage() {
  void prefetch(trpc.getDepartments.queryOptions({}))

  return (
    <HydrateClient>
      <IssuesContainer />
    </HydrateClient>
  )
}
