import { ApplicationContainer } from '../../components/front-page/ApplicationContainer'
import { HeroContainer } from '../../components/front-page/HeroContainer'
import { SectionContainer } from '../../components/front-page/SectionContainer'
import { fetchQuery, trpc } from '../../lib/nTrpc/client/server'

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
    <>
      <HeroContainer />
      <SectionContainer
        inprogressStats={inprogressStats}
        statusStats={countByStatusStats}
        toBePublishedStats={readyForPublishingStats}
      />
      <ApplicationContainer />
    </>
  )
}
