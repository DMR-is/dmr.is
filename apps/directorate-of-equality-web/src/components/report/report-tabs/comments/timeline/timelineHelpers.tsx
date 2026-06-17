'use client'

import {
  CommentVisibilityEnum,
  ReportEventTypeEnum,
  ReportRoleEnum,
  ReportTimelineItemDto,
  ReportTimelineItemKindEnum,
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
  companyName?: string | null,
): React.ReactNode {
  if (item.kind === ReportTimelineItemKindEnum.COMMENT) {
    const comment = item.comment
    const isCompany = comment?.authorKind === ReportRoleEnum.COMPANY
    const authorName = isCompany
      ? (companyName ?? reportText.timeline.company)
      : (comment?.authorName ?? reportText.timeline.employee)
    return (
      <>
        <Bold>{authorName}</Bold> {reportText.timeline.registersMessage}
      </>
    )
  }

  if (!item.event) return null

  const { eventType, actorName, assignedUserName, toStatus } = item.event

  if (eventType === ReportEventTypeEnum.SUBMITTED) {
    return companyName ? (
      <>
        <Bold>{companyName}</Bold> {reportText.timeline.submitsReport}
      </>
    ) : (
      <>{reportText.timeline.reportSubmitted}</>
    )
  }

  if (eventType === ReportEventTypeEnum.ASSIGNED && assignedUserName) {
    if (actorName && actorName !== assignedUserName) {
      return (
        <>
          <Bold>{actorName}</Bold> {reportText.timeline.assignedOther}{' '}
          <Bold>{assignedUserName}</Bold>{' '}
          {reportText.timeline.assignedOtherSuffix}
        </>
      )
    }

    return (
      <>
        <Bold>{assignedUserName}</Bold> {reportText.timeline.claimsCase}
      </>
    )
  }

  if (eventType === ReportEventTypeEnum.UNASSIGNED) {
    const unassignedName =
      assignedUserName && assignedUserName !== actorName
        ? assignedUserName
        : null

    if (actorName && unassignedName) {
      return (
        <>
          <Bold>{actorName}</Bold> {reportText.timeline.unassignedOther}{' '}
          <Bold>{unassignedName}</Bold>{' '}
          {reportText.timeline.unassignedOtherSuffix}
        </>
      )
    }

    return (
      <>
        {actorName && <Bold>{actorName} </Bold>}
        {reportText.timeline.unassigned}
      </>
    )
  }

  if (eventType === ReportEventTypeEnum.STATUS_CHANGED) {
    const statusLabel = toStatus ? ReportStatusTranslatedEnum[toStatus] : null
    return (
      <>
        {actorName && <Bold>{actorName} </Bold>}
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
