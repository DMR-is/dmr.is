'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import {
  ReportEventTypeEnum,
  ReportStatusEnum,
  ReportTimelineItemDto,
  ReportTimelineItemKindEnum,
} from '../../../gen/fetch'
import { companiesText } from '../../../lib/text'
import { TimelineFeed } from '../../report/report-tabs/comments/timeline/TimelineFeed'

const t = companiesText.detailView

// Mocked until company timeline API endpoint is available
const MOCKED_TIMELINE: ReportTimelineItemDto[] = [
  {
    kind: ReportTimelineItemKindEnum.EVENT,
    createdAt: '2026-01-10T09:00:00Z',
    event: {
      id: 'mock-event-1',
      reportId: '',
      eventType: ReportEventTypeEnum.SUBMITTED,
      reportStatus: ReportStatusEnum.SUBMITTED,
      fromStatus: null,
      toStatus: ReportStatusEnum.SUBMITTED,
      createdAt: '2026-01-10T09:00:00Z',
    },
  },
  {
    kind: ReportTimelineItemKindEnum.EVENT,
    createdAt: '2026-02-14T11:30:00Z',
    event: {
      id: 'mock-event-2',
      reportId: '',
      eventType: ReportEventTypeEnum.STATUS_CHANGED,
      reportStatus: ReportStatusEnum.IN_REVIEW,
      fromStatus: ReportStatusEnum.SUBMITTED,
      toStatus: ReportStatusEnum.IN_REVIEW,
      createdAt: '2026-02-14T11:30:00Z',
    },
  },
  {
    kind: ReportTimelineItemKindEnum.EVENT,
    createdAt: '2026-04-03T14:00:00Z',
    event: {
      id: 'mock-event-3',
      reportId: '',
      eventType: ReportEventTypeEnum.STATUS_CHANGED,
      reportStatus: ReportStatusEnum.APPROVED,
      fromStatus: ReportStatusEnum.IN_REVIEW,
      toStatus: ReportStatusEnum.APPROVED,
      createdAt: '2026-04-03T14:00:00Z',
    },
  },
]

export const CompanyTimeline = () => {
  return (
    <>
      <Text variant="h4" marginBottom={4}>
        {t.timelineHeading}
      </Text>
      <Box
        display="flex"
        flexDirection="column"
        background="blue100"
        padding={4}
        borderRadius="large"
      >
        <TimelineFeed
          timeline={MOCKED_TIMELINE}
          usersById={new Map()}
          companyName={undefined}
          currentUserId={undefined}
          onDelete={() => undefined}
        />
      </Box>
    </>
  )
}
