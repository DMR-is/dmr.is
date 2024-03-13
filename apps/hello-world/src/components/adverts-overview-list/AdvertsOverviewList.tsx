import { Box, SkeletonLoader, Text } from '@island.is/island-ui/core'
import type { AdvertCategory } from '../../hooks/useMockAdvertOverview'
import { useMockAdvertOverview } from '../../hooks/useMockAdvertOverview'
import * as styles from './AdvertsOverviewList.css'
import { messages } from '../../lib/messages'
type Props = {
  variant?: AdvertCategory
}

type ItemProps = {
  children: React.ReactNode
}
const AdvertsOverviewListItem = ({ children }: ItemProps) => {
  return <li className={styles.advertsOverviewListItem}>{children}</li>
}

export const AdvertsOverviewList = ({ variant = 'default' }: Props) => {
  const [data, { loading }] = useMockAdvertOverview(variant)

  const renderList = () => {
    switch (data.__typename__) {
      case 'regular':
        return (
          <>
            <AdvertsOverviewListItem>
              {messages.components.adverts_overview_list.editorial.waitingForReview.replace(
                '{total}',
                data.unassignedAdverts.toString(),
              )}
            </AdvertsOverviewListItem>
            <AdvertsOverviewListItem>
              {messages.components.adverts_overview_list.editorial.recentlyUpdated.replace(
                '{total}',
                data.recentlyUpdatedAdverts.toString(),
              )}
            </AdvertsOverviewListItem>
            <AdvertsOverviewListItem>
              {messages.components.adverts_overview_list.editorial.fastTractSubmitted.replace(
                '{total}',
                data.submittedFastTrackAdverts.toString(),
              )}
            </AdvertsOverviewListItem>
            <AdvertsOverviewListItem>
              {messages.components.adverts_overview_list.editorial.fastTrackInReview.replace(
                '{total}',
                data.inReadingFastTrackAdverts.toString(),
              )}
            </AdvertsOverviewListItem>
          </>
        )
      case 'readyForPublishing':
        return (
          <>
            <AdvertsOverviewListItem>
              {messages.components.adverts_overview_list.publishing.today.replace(
                '{total}',
                data.publishToday.toString(),
              )}
            </AdvertsOverviewListItem>
            <AdvertsOverviewListItem>
              {messages.components.adverts_overview_list.publishing.pastDue.replace(
                '{total}',
                data.pastPublishingDate.toString(),
              )}
            </AdvertsOverviewListItem>
          </>
        )
      case 'assigned':
        return null
      case 'inactive':
        return null
    }
  }

  if (data.totalAdverts === 0) {
    return (
      <Box className={styles.advertsOverviewListEmpty}>
        <div>
          <Text variant="h3">
            {messages.components.adverts_overview_list.empty.title}
          </Text>
          <Text>
            {variant === 'default'
              ? messages.components.adverts_overview_list.empty.editorial
              : variant === 'readyForPublishing'
              ? messages.components.adverts_overview_list.empty.published
              : variant === 'assigned'
              ? messages.components.adverts_overview_list.empty.assigned
              : messages.components.adverts_overview_list.empty.inactive}
          </Text>
        </div>
        <Box component="img" src="/assets/empty-image.svg" />
      </Box>
    )
  }

  if (loading) {
    return (
      <SkeletonLoader repeat={3} space={3} height={40} borderRadius="large" />
    )
  }

  return <ul className={styles.advertsListOverview}>{renderList()}</ul>
}
