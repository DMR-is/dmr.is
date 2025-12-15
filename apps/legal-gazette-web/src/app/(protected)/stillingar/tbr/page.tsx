import { prefetch } from '@dmr.is/trpc/client/server'

import { TBRSettingsContainer } from '../../../../containers/TBRSettingsContainer'
import { trpc } from '../../../../lib/trpc/client/server'

export default async function TBRSettingsPage() {
  prefetch(trpc.getTbrSettings.queryOptions({}))

  return <TBRSettingsContainer />
}
