'use client'

import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import {
  ReportCommentDto,
  ReportEventTypeEnum,
  ReportRoleEnum,
  ReportStatusEnum,
  ReportTimelineItemDto,
  ReportTimelineItemKindEnum,
} from '../../../gen/fetch'
import { companiesText } from '../../../lib/text'
import { useTRPC } from '../../../lib/trpc/client/trpc'
import { TimelineFeed } from '../../report/report-tabs/comments/timeline/TimelineFeed'

const t = companiesText.detailView

// Mocked until company timeline API endpoint is available
const MOCKED_EVENTS: ReportTimelineItemDto[] = [
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
  const trpc = useTRPC()
  const [body, setBody] = useState('')
  const [comments, setComments] = useState<ReportTimelineItemDto[]>([])

  const { data: users = [] } = useQuery(trpc.user.list.queryOptions())
  const { data: me } = useQuery(trpc.user.getMyUser.queryOptions())

  const usersById = new Map(users.map((u) => [u.id, u]))

  const timeline = [...MOCKED_EVENTS, ...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

  const handleSubmit = () => {
    if (!body.trim()) return

    const newComment: ReportCommentDto = {
      id: `local-${Date.now()}`,
      reportId: '',
      authorKind: ReportRoleEnum.REVIEWER,
      authorUserId: me?.id ?? null,
      visibility: 'INTERNAL' as const,
      body: body.trim(),
      reportStatus: ReportStatusEnum.SUBMITTED,
      createdAt: new Date().toISOString(),
    }

    setComments((prev) => [
      ...prev,
      {
        kind: ReportTimelineItemKindEnum.COMMENT,
        createdAt: newComment.createdAt,
        comment: newComment,
      },
    ])
    setBody('')
  }

  const handleDelete = (commentId: string) => {
    setComments((prev) => prev.filter((item) => item.comment?.id !== commentId))
  }

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
          timeline={timeline}
          usersById={usersById}
          currentUserId={me?.id}
          onDelete={handleDelete}
        />
        <Box marginTop={4} display="flex" flexDirection="column" rowGap={3}>
          <Input
            name="company-comment"
            label={t.comments.label}
            placeholder={t.comments.placeholder}
            textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <Box alignSelf="flexEnd">
            <Button onClick={handleSubmit} disabled={!body.trim()}>
              {t.comments.submit}
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  )
}
