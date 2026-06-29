'use client'

import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import {
  CommentVisibilityEnum,
  CompanyReminderTierEnum,
  CompanyTimelineItemDto,
  ReportRoleEnum,
  ReportStatusEnum,
  ReportTimelineItemDto,
  ReportTimelineItemKindEnum,
} from '../../../gen/fetch'
import { formatDateIS } from '../../../lib/constants'
import { companiesText, reportText } from '../../../lib/text'
import { useTRPC } from '../../../lib/trpc/client/trpc'
import { TimelineFeed } from '../../report/report-tabs/comments/timeline/TimelineFeed'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const t = companiesText.detailView

const REMINDER_TIER_LABELS: Record<CompanyReminderTierEnum, string> = {
  [CompanyReminderTierEnum.SIX_MONTHS]: reportText.timeline.reminderTierSixMonths,
  [CompanyReminderTierEnum.TWO_MONTHS]: reportText.timeline.reminderTierTwoMonths,
  [CompanyReminderTierEnum.TWO_WEEKS]: reportText.timeline.reminderTierTwoWeeks,
  [CompanyReminderTierEnum.DUE]: reportText.timeline.reminderTierDue,
}

// For reminder events the raw `reason` is the ISO due date. Turn it (plus the
// tier) into a readable line for the timeline body; pass other reasons through.
function eventBody(event: CompanyTimelineItemDto['event']): string | null {
  if (!event) return null
  const tierLabel = event.reminderTier
    ? REMINDER_TIER_LABELS[event.reminderTier]
    : null
  if (!tierLabel) return event.reason ?? null
  const date = event.reason ? formatDateIS(event.reason) : null
  return date
    ? `${tierLabel} · ${reportText.timeline.reminderDueDatePrefix} ${date}`
    : tierLabel
}

type Props = {
  companyId: string
}

function adaptTimeline(
  items: CompanyTimelineItemDto[],
): ReportTimelineItemDto[] {
  return items.map((item) => ({
    kind: item.kind as unknown as ReportTimelineItemKindEnum,
    createdAt: item.createdAt,
    event: item.event
      ? {
          id: item.event.id,
          reportId: item.event.companyId,
          eventType: item.event.eventType as unknown as never,
          actorUserId: item.event.actorUserId ?? null,
          actorName: item.event.actorName ?? null,
          reportStatus: item.event.status as unknown as ReportStatusEnum,
          fromStatus:
            (item.event.fromStatus as unknown as ReportStatusEnum) ?? null,
          toStatus:
            (item.event.toStatus as unknown as ReportStatusEnum) ?? null,
          reason: eventBody(item.event),
          createdAt: item.event.createdAt,
        }
      : null,
    comment: item.comment
      ? {
          id: item.comment.id,
          reportId: item.comment.companyId,
          authorKind: ReportRoleEnum.REVIEWER,
          authorUserId: item.comment.authorUserId ?? null,
          authorName: item.comment.authorName ?? null,
          visibility: CommentVisibilityEnum.INTERNAL,
          body: item.comment.body,
          reportStatus: ReportStatusEnum.SUBMITTED,
          createdAt: item.comment.createdAt,
        }
      : null,
  }))
}

export const CompanyTimeline = ({ companyId }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [body, setBody] = useState('')

  const timelineQuery = trpc.company.getTimeline.queryOptions({ id: companyId })
  const { data: timelineItems = [] } = useQuery(timelineQuery)

  const { data: me } = useQuery(trpc.user.getMyUser.queryOptions())

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: timelineQuery.queryKey })

  const createComment = useMutation(
    trpc.company.comments.create.mutationOptions({
      onSuccess: () => {
        invalidate()
        setBody('')
      },
    }),
  )

  const deleteComment = useMutation(
    trpc.company.comments.delete.mutationOptions({
      onSuccess: invalidate,
    }),
  )

  const handleSubmit = () => {
    if (!body.trim()) return
    createComment.mutate({ id: companyId, body: body.trim() })
  }

  const handleDelete = (commentId: string) => {
    deleteComment.mutate({ id: companyId, commentId })
  }

  const timeline = adaptTimeline(timelineItems)

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
            <Button
              onClick={handleSubmit}
              disabled={!body.trim() || createComment.isPending}
            >
              {t.comments.submit}
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  )
}
