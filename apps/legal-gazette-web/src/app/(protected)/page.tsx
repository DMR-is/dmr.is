import { ApplicationContainer } from '../../components/front-page/ApplicationContainer'
import { HeroContainer } from '../../components/front-page/HeroContainer'
import { SectionContainer } from '../../components/front-page/SectionContainer'
import { fetchQuery, trpc } from '../../lib/nTrpc/client/server'

export default async function IndexPage() {
  const countByStatusPromise = fetchQuery(
    trpc.getCountByStatuses.queryOptions(),
  )
  const advertsInprogressStats = fetchQuery(
    trpc.getAdvertsInProgressStats.queryOptions(),
  )
  const readyForPublishingStats = fetchQuery(
    trpc.getAdvertsToBePublishedStats.queryOptions(),
  )

  const [countByStatus, inprogressStats, readyForPublishing] =
    await Promise.all([
      countByStatusPromise,
      advertsInprogressStats,
      readyForPublishingStats,
    ])

  return (
    <>
      <HeroContainer />
      <SectionContainer />
      <ApplicationContainer />
    </>
  )
}
