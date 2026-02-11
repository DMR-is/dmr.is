import { fetchQuery } from '@dmr.is/trpc/client/server'
import { Box } from '@dmr.is/ui/components/island-is/Box'

import { ApplicationContainer } from '../../components/front-page/ApplicationContainer'
import { HeroContainer } from '../../components/front-page/HeroContainer'
import { SectionContainer } from '../../components/front-page/SectionContainer'
import { trpc } from '../../lib/trpc/client/server'

export default async function IndexPage() {
  const countByStatusPromise = fetchQuery(
    trpc.getCountByStatuses.queryOptions(),
  )
  const advertsInprogressPromise = fetchQuery(
    trpc.getAdvertsInProgressStats.queryOptions(),
  )
  const readyForPublishingPromise = fetchQuery(
    trpc.getAdvertsToBePublishedStats.queryOptions(),
  )

  const [countByStatusStats, inprogressStats, readyForPublishingStats] =
    await Promise.all([
      countByStatusPromise,
      advertsInprogressPromise,
      readyForPublishingPromise,
    ])

  return (
    <Box marginTop={[2, 4]}>
      <HeroContainer />
      <SectionContainer
        inprogressStats={inprogressStats}
        statusStats={countByStatusStats}
        toBePublishedStats={readyForPublishingStats}
      />
      <ApplicationContainer />
    </Box>
  )
}
