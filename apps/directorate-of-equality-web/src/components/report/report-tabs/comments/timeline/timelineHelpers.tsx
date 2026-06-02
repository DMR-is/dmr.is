'use client'

import {
  CommentVisibilityEnum,
  ReportEventTypeEnum,
  ReportRoleEnum,
  ReportTimelineItemDto,
  ReportTimelineItemKindEnum,
  UserDto,
} from '../../../../../gen/fetch'
import {
  formatDateIS,
  ReportStatusTranslatedEnum,
} from '../../../../../lib/constants'
import { reportText } from '../../../../../lib/text'

export function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr)
  const diffDays = Math.floor(
    (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24),
  )
  if (diffDays === 0) return 'Í dag'
  if (diffDays === 1) return 'Í gær'
  if (diffDays < 7) return `f. ${diffDays} dögum`
  return formatDateIS(dateStr)
}

export function Bold({ children }: { children: React.ReactNode }) {
  return <strong style={{ fontWeight: 600 }}>{children}</strong>
}

export function userName(user: UserDto): string {
  return `${user.firstName === 'Gervimaður' ? 'GM' : user.firstName} ${user.lastName}`
}

export type TimelineEntryKind = 'event' | 'outgoing' | 'incoming' | 'internal'

export function timelineEntryKind(
  item: ReportTimelineItemDto,
): TimelineEntryKind {
  if (item.kind === ReportTimelineItemKindEnum.EVENT) return 'event'
  if (item.comment?.authorKind === ReportRoleEnum.COMPANY) return 'incoming'
  if (item.comment?.visibility === CommentVisibilityEnum.INTERNAL)
    return 'internal'
  return 'outgoing'
}

export function timelineEntryText(
  item: ReportTimelineItemDto,
  usersById: Map<string, UserDto>,
  companyName?: string | null,
): React.ReactNode {
  if (item.kind === ReportTimelineItemKindEnum.COMMENT) {
    const comment = item.comment
    const user = usersById.get(comment?.authorUserId ?? '')
    const isCompany = comment?.authorKind === ReportRoleEnum.COMPANY
    const authorName = isCompany
      ? (companyName ?? reportText.timeline.company)
      : user
        ? userName(user)
        : reportText.timeline.employee
    return (
      <>
        <Bold>{authorName}</Bold> {reportText.timeline.registersMessage}
      </>
    )
  }

  if (!item.event) return null

  const { eventType, assignedUserId, actorUserId, toStatus } = item.event

  if (eventType === ReportEventTypeEnum.SUBMITTED) {
    return companyName ? (
      <>
        <Bold>{companyName}</Bold> {reportText.timeline.submitsReport}
      </>
    ) : (
      <>{reportText.timeline.reportSubmitted}</>
    )
  }

  if (eventType === ReportEventTypeEnum.ASSIGNED && assignedUserId) {
    const user = usersById.get(assignedUserId)
    return user ? (
      <>
        <Bold>{userName(user)}</Bold> {reportText.timeline.claimsCase}
      </>
    ) : (
      <>{reportText.timeline.assigned}</>
    )
  }

  if (eventType === ReportEventTypeEnum.UNASSIGNED) {
    const actor = actorUserId ? usersById.get(actorUserId) : null
    return (
      <>
        {actor && <Bold>{userName(actor)} </Bold>}
        {reportText.timeline.unassigned}
      </>
    )
  }

  if (eventType === ReportEventTypeEnum.STATUS_CHANGED) {
    const statusLabel = toStatus ? ReportStatusTranslatedEnum[toStatus] : null
    const actor = actorUserId ? usersById.get(actorUserId) : null
    return (
      <>
        {actor && <Bold>{userName(actor)} </Bold>}
        {reportText.timeline.movesToStatus}{' '}
        {statusLabel ? <Bold>{statusLabel}</Bold> : null}
      </>
    )
  }

  const FALLBACK: Partial<Record<ReportEventTypeEnum, string>> = {
    [ReportEventTypeEnum.SUPERSEDED]: reportText.timeline.superseded,
  }
  return FALLBACK[eventType] ?? eventType
}
