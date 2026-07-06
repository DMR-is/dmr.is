'use client'

import { theme } from '@dmr.is/island-ui-theme'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'

import {
  AutoReviewDecisionEnum,
  ReportEventTypeEnum,
  ReportTimelineItemDto,
} from '../../../../../gen/fetch'
import { TimelineEntryKind } from './timelineHelpers'

type Props = {
  kind: TimelineEntryKind
  item: ReportTimelineItemDto
}

export function TimelineEntryIcon({ kind, item }: Props) {
  const isEvent = kind === 'event'
  const isIncoming = kind === 'incoming'
  const isInternal = kind === 'internal'

  // A soft auto-review verdict routing the report to manual review gets a
  // warning icon instead of the generic event checkmark.
  const isSystemNeedsReview =
    item.event?.eventType === ReportEventTypeEnum.SYSTEM_AUTO_REVIEW &&
    item.event?.systemDecision === AutoReviewDecisionEnum.NEEDS_REVIEW

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        flexShrink: 0,
        backgroundColor:
          isEvent || isInternal ? 'transparent' : theme.color.blue400,
        border:
          isEvent || isInternal ? `1px solid ${theme.color.blue400}` : 'none',
      }}
    >
      {isSystemNeedsReview ? (
        <Icon icon="warning" type="outline" color="blue400" />
      ) : isEvent ? (
        <Icon icon="checkmark" color="blue400" />
      ) : isIncoming ? (
        <Icon icon="arrowBack" color="white" />
      ) : isInternal ? (
        <Icon icon="pencil" color="blue400" />
      ) : (
        <Icon icon="arrowForward" color="white" />
      )}
    </Box>
  )
}
