import { Box, Text } from '@island.is/island-ui/core'

import type { AdvertCategory } from '../../hooks/useMockAdvertOverview'
import { messages } from '../../lib/messages'
import * as styles from './AdvertsOverviewList.css'

type Category = {
  text: string
  totalAdverts: number
}

type AdvertOverviewData = {
  categories: Category[]
  totalAdverts: number
}

type Props = {
  variant?: AdvertCategory
  data: AdvertOverviewData | null
}

type ItemProps = {
  children: React.ReactNode
}
const AdvertsOverviewListItem = ({ children }: ItemProps) => {
  return <li className={styles.advertsOverviewListItem}>{children}</li>
}

export const AdvertsOverviewList = ({ variant = 'default', data }: Props) => {
  if (!data || data?.totalAdverts === 0) {
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

  return (
    <ul className={styles.advertsListOverview}>
      {data?.totalAdverts &&
        data?.categories.map((category, index) => (
          <AdvertsOverviewListItem key={index}>
            {category.text}
          </AdvertsOverviewListItem>
        ))}
    </ul>
  )
}
