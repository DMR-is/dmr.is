import { Box, Text } from '@island.is/island-ui/core'

import { GetStatisticsOverviewResponse } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import * as styles from './CasesOverviewList.css'
import { messages } from './messages'

type Props = {
  variant?: 'default' | 'assigned' | 'inactive' | 'readyForPublishing'
  data: GetStatisticsOverviewResponse | null
}

type ItemProps = {
  children: React.ReactNode
}
const CasesOverviewListItem = ({ children }: ItemProps) => {
  return <li className={styles.casesOverviewListItem}>{children}</li>
}

export const CasesOverviewList = ({ variant = 'default', data }: Props) => {
  const { formatMessage } = useFormatMessage()

  if (!data || data?.totalCases === 0) {
    return (
      <Box className={styles.casesOverviewListEmpty}>
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
    <ul className={styles.casesListOverview}>
      {data?.totalCases &&
        data?.categories.map((category, index) => (
          <CasesOverviewListItem key={index}>
            {category.text}
          </CasesOverviewListItem>
        ))}
    </ul>
  )
}
