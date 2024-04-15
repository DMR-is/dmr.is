import { Box, Text } from '@island.is/island-ui/core'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import type { AdvertCategory } from '../../hooks/useMockAdvertOverview'
import * as styles from './AdvertsOverviewList.css'
import { messages } from './messages'

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
  const { formatMessage } = useFormatMessage()

  if (!data || data?.totalAdverts === 0) {
    return (
      <Box className={styles.advertsOverviewListEmpty}>
        <div>
          <Text variant="h3">{formatMessage(messages.empty.title)}</Text>
          <Text>
            {variant === 'default'
              ? formatMessage(messages.empty.editorial)
              : variant === 'readyForPublishing'
              ? formatMessage(messages.empty.published)
              : variant === 'assigned'
              ? formatMessage(messages.empty.assigned)
              : formatMessage(messages.empty.inactive)}
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
