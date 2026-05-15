'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import {
  CommentVisibilityEnum,
  ReportTimelineItemDto,
  ReportTimelineItemKindEnum,
  UserDto,
} from '../../../gen/fetch'
import { TimelineEntryIcon } from './TimelineEntryIcon'
import {
  formatRelativeDate,
  timelineEntryKind,
  timelineEntryText,
} from './timelineHelpers'

type Props = {
  item: ReportTimelineItemDto
  usersById: Map<string, UserDto>
  companyName?: string | null
  currentUserId?: string | null
  onDelete: (commentId: string) => void
}

export function TimelineEntry({
  item,
  usersById,
  companyName,
  currentUserId,
  onDelete,
}: Props) {
  const kind = timelineEntryKind(item)
  const text = timelineEntryText(item, usersById, companyName)
  const date = formatRelativeDate(
    item.comment?.createdAt ?? item.event?.createdAt ?? '',
  )

  const isComment = item.kind === ReportTimelineItemKindEnum.COMMENT
  const comment = item.comment
  const isExternal = comment?.visibility === CommentVisibilityEnum.EXTERNAL
  const canDelete =
    isComment &&
    comment?.authorUserId != null &&
    comment.authorUserId === currentUserId &&
    comment.visibility !== CommentVisibilityEnum.EXTERNAL
  const bodyText = isComment ? (comment?.body ?? null) : (item.event?.reason ?? null)
  const hasBody = !!bodyText

  return (
    <Box
      display="flex"
      flexDirection="row"
      alignItems={hasBody ? 'flexStart' : 'center'}
      columnGap={2}
      paddingY={3}
      paddingX={2}
    >
      <TimelineEntryIcon kind={kind} />
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Box
          display="flex"
          justifyContent="spaceBetween"
          alignItems="flexStart"
        >
          <Text>{text}</Text>
          <Box style={{ whiteSpace: 'nowrap', marginLeft: 8 }}>
            <Text>{date}</Text>
          </Box>
        </Box>

        {bodyText && (
          <Box paddingRight={6}>
            <Text marginTop={1}>{bodyText}</Text>
          </Box>
        )}

        {isExternal && (
          <Box display="flex" justifyContent="flexEnd" marginTop={1}>
            <Tag disabled outlined variant="blue">
              Sýnilegt innsendanda
            </Tag>
          </Box>
        )}
        {canDelete && (
          <Box marginTop={1}>
            <Button
              variant="text"
              size="small"
              onClick={() => onDelete(comment.id)}
              icon="trash"
              iconType="outline"
            >
              Eyða
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  )
}
