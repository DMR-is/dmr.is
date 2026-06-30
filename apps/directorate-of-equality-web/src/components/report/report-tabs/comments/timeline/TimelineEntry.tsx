'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import {
  CommentVisibilityEnum,
  ReportEventTypeEnum,
  ReportTimelineItemDto,
  ReportTimelineItemKindEnum,
} from '../../../../../gen/fetch'
import { reportText, sharedText } from '../../../../../lib/text'
import { TimelineEntryIcon } from './TimelineEntryIcon'
import {
  formatRelativeDate,
  renderSystemReason,
  timelineEntryKind,
  timelineEntryText,
} from './timelineHelpers'

type Props = {
  item: ReportTimelineItemDto
  companyName?: string | null
  currentUserId?: string | null
  onDelete: (commentId: string) => void
}

export function TimelineEntry({
  item,
  companyName,
  currentUserId,
  onDelete,
}: Props) {
  const kind = timelineEntryKind(item)
  const text = timelineEntryText(item, companyName)
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
  const bodyText = isComment
    ? (comment?.body ?? null)
    : (item.event?.reason ?? null)
  const hasBody = !!bodyText
  // System auto-review reasons get their percentages bolded; everything else
  // renders verbatim.
  const isSystemAutoReview =
    item.event?.eventType === ReportEventTypeEnum.SYSTEM_AUTO_REVIEW
  const bodyContent =
    bodyText && isSystemAutoReview ? renderSystemReason(bodyText) : bodyText

  return (
    <Box
      display="flex"
      flexDirection="row"
      alignItems={hasBody ? 'flexStart' : 'center'}
      columnGap={2}
      paddingY={3}
      paddingX={2}
    >
      <TimelineEntryIcon kind={kind} item={item} />
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Box
          display="flex"
          justifyContent="spaceBetween"
          alignItems="flexStart"
          rowGap={1}
          columnGap={1}
          flexDirection={['columnReverse', 'columnReverse', 'row']}
        >
          <Text>{text}</Text>
          <Box>
            <Text>{date}</Text>
          </Box>
        </Box>

        {bodyText && (
          <Box paddingRight={6}>
            <Text marginTop={1}>{bodyContent}</Text>
          </Box>
        )}

        {isExternal && (
          <Box
            display="flex"
            justifyContent={['flexStart', 'flexStart', 'flexEnd']}
            marginTop={1}
          >
            <Tag disabled outlined variant="blue">
              {reportText.comments.visibleToApplicant}
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
              {sharedText.delete}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  )
}
