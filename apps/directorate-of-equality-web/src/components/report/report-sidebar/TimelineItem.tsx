'use client'

import format from 'date-fns/format'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { ReportTimelineItemDto, UserDto } from '../../../gen/fetch'
import { timelineNode } from './timelineNode'

type Props = {
  item: ReportTimelineItemDto
  usersById: Map<string, UserDto>
  companyName?: string | null
}

export function TimelineItem({ item, usersById, companyName }: Props) {
  return (
    <Box
      display="flex"
      flexDirection="row"
      justifyContent="spaceBetween"
      columnGap={2}
      marginBottom={1}
    >
      <Text variant="medium">{timelineNode(item, usersById, companyName)}</Text>
      <Text variant="small" color="dark400">
        {format(new Date(item.createdAt), 'dd.MM.yy')}
      </Text>
    </Box>
  )
}
