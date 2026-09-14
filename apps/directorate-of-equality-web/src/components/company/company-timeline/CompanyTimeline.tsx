'use client'

import { useMemo, useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import {
  ApiKeyDto,
  CommentVisibilityEnum,
  CompanyReminderTierEnum,
  CompanyTimelineItemDto,
  ReportRoleEnum,
  ReportStatusEnum,
  ReportTimelineItemKindEnum,
} from '../../../gen/fetch'
import { formatDateIS } from '../../../lib/constants'
import { companiesText, reportText } from '../../../lib/text'
import { useTRPC } from '../../../lib/trpc/client/trpc'
import { TimelineFeed } from '../../report/report-tabs/comments/timeline/TimelineFeed'
import { TimelineItem } from '../../report/report-tabs/comments/timeline/timelineHelpers'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const t = companiesText.detailView

const REMINDER_TIER_LABELS: Record<CompanyReminderTierEnum, string> = {
  [CompanyReminderTierEnum.SIX_MONTHS]:
    reportText.timeline.reminderTierSixMonths,
  [CompanyReminderTierEnum.TWO_MONTHS]:
    reportText.timeline.reminderTierTwoMonths,
  [CompanyReminderTierEnum.TWO_WEEKS]: reportText.timeline.reminderTierTwoWeeks,
  [CompanyReminderTierEnum.DUE]: reportText.timeline.reminderTierDue,
}

// Company events overload `reason` with whatever that event type needs, so the
// body is composed per type rather than printed raw.
//
//   reminders  → the ISO due date; rendered with the tier as a readable line.
//   API keys   → the key's public id, optionally followed by
//                " — <revocation reason>". NOT rendered: it is a correlation
//                handle, and putting half a credential on screen tells an admin
//                nothing they can act on. It is used to look the key up in the
//                list the aðgangslyklar tab already loads, and what gets shown
//                is the key's label and lifetime.
//   everything else → the reason as given (a status change's explanation).
const API_KEY_EVENT_TYPES = new Set(['API_KEY_ISSUED', 'API_KEY_REVOKED'])

/** `keyId`, or `keyId — reason` on a revocation. */
const parseApiKeyReason = (reason: string): [string, string | null] => {
  const [keyId, ...rest] = reason.split(' — ')
  return [keyId, rest.length ? rest.join(' — ') : null]
}

function apiKeyEventBody(
  event: NonNullable<CompanyTimelineItemDto['event']>,
  keysByKeyId: Map<string, ApiKeyDto>,
): string | null {
  if (!event.reason) return null

  const [keyId, revokedReason] = parseApiKeyReason(event.reason)
  const key = keysByKeyId.get(keyId)

  const parts: string[] = []

  // The label is the only human name a key has, and it is optional.
  if (key?.label) {
    parts.push(`„${key.label}“`)
  }

  if ((event.eventType as unknown as string) === 'API_KEY_ISSUED') {
    // How long it lasts — the question an admin actually has about a key that
    // was just minted. `expiresAt` null means it never expires, which is worth
    // saying out loud rather than leaving blank.
    parts.push(
      key?.expiresAt
        ? `${reportText.timeline.apiKeyExpiresPrefix} ${formatDateIS(key.expiresAt)}`
        : reportText.timeline.apiKeyNoExpiry,
    )
  } else if (revokedReason) {
    parts.push(`${reportText.timeline.apiKeyRevokedReasonPrefix} ${revokedReason}`)
  }

  // Nothing worth saying — better an empty body than a hex string. Happens
  // while the key list is still loading, and on an event whose key predates
  // whatever the list can still see.
  return parts.length ? parts.join(' · ') : null
}

function eventBody(
  event: CompanyTimelineItemDto['event'],
  keysByKeyId: Map<string, ApiKeyDto>,
): string | null {
  if (!event) return null

  if (API_KEY_EVENT_TYPES.has(event.eventType as unknown as string)) {
    return apiKeyEventBody(event, keysByKeyId)
  }

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
  /**
   * Forwarded to the feed so an actorless event ("Fyrirtæki X skráð") can name
   * the company. Passed in rather than fetched: the caller is rendering the
   * company already, so refetching it here would be a second request for a
   * string we hold.
   */
  companyName: string
}

function adaptTimeline(
  items: CompanyTimelineItemDto[],
  keysByKeyId: Map<string, ApiKeyDto>,
): TimelineItem[] {
  return items.map((item) => ({
    kind: item.kind as unknown as ReportTimelineItemKindEnum,
    createdAt: item.createdAt,
    event: item.event
      ? {
          // Company scope: STATUS_CHANGED means the register lifecycle here,
          // not a report moving through review.
          scope: 'company' as const,
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
          reason: eventBody(item.event, keysByKeyId),
          // Null on every event but the three CUSTOM_EMAIL_* ones; where it is
          // set, the entry becomes expandable into the message that was sent.
          companyEmailId: item.event.companyEmailId ?? null,
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
          // Carried through so the feed can label a seeded note as "Kerfið"
          // instead of falling back to an unnamed member of staff.
          isSystem: item.comment.isSystem,
          visibility: CommentVisibilityEnum.INTERNAL,
          body: item.comment.body,
          reportStatus: ReportStatusEnum.SUBMITTED,
          createdAt: item.comment.createdAt,
        }
      : null,
  }))
}

export const CompanyTimeline = ({ companyId, companyName }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [body, setBody] = useState('')

  const timelineQuery = trpc.company.getTimeline.queryOptions({ id: companyId })
  const { data: timelineItems = [] } = useQuery(timelineQuery)

  const { data: me } = useQuery(trpc.user.getMyUser.queryOptions())

  // The same list the aðgangslyklar tab loads, so on a company whose keys have
  // already been viewed this is served from cache. Keyed by the public key id
  // because that is what the event rows carry.
  const { data: apiKeys } = useQuery(
    trpc.apiKey.listForCompany.queryOptions({ companyId }),
  )

  const keysByKeyId = useMemo(
    () => new Map((apiKeys?.apiKeys ?? []).map((key) => [key.keyId, key])),
    [apiKeys],
  )

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

  const timeline = adaptTimeline(timelineItems, keysByKeyId)

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
          companyName={companyName}
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
