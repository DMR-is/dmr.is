'use client'

import {
  AutoReviewDecisionEnum,
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

/**
 * Renders an auto-review reason with the headline percentages bolded. The
 * threshold figures live inside parentheses (e.g. "12% yfir mörkum (10%)") and
 * are left un-bolded so only the report's own numbers stand out.
 */
export function renderSystemReason(reason: string): React.ReactNode {
  const out: React.ReactNode[] = []
  // Split into parenthetical (threshold) groups and the text between them.
  const segments = reason.split(/(\([^)]*\))/g)
  segments.forEach((seg, segIdx) => {
    if (seg.startsWith('(')) {
      out.push(seg)
      return
    }
    const percent = /\d+(?:[.,]\d+)?%/g
    let last = 0
    let k = 0
    let m: RegExpExecArray | null
    while ((m = percent.exec(seg))) {
      if (m.index > last) out.push(seg.slice(last, m.index))
      out.push(<Bold key={`p-${segIdx}-${k++}`}>{m[0]}</Bold>)
      last = m.index + m[0].length
    }
    if (last < seg.length) out.push(seg.slice(last))
  })
  return out
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

  const { eventType, actorName, assignedUserName, toStatus, systemDecision } =
    item.event

  if (eventType === ReportEventTypeEnum.SYSTEM_AUTO_REVIEW) {
    // Soft auto-review verdict — system actor, no name. The `reason` renders as
    // the entry body; this is just the headline. Status is never changed yet.
    const headline =
      systemDecision === AutoReviewDecisionEnum.AUTO_APPROVE
        ? reportText.timeline.systemAutoReviewApprove
        : reportText.timeline.systemAutoReviewNeedsReview
    // Bold the system actor name ("Kerfið") that opens the headline and the
    // trailing status word (e.g. "yfirferð").
    const words = headline.split(' ')
    const actor = words[0]
    const status = words[words.length - 1]
    const middle = words.slice(1, -1).join(' ')
    return (
      <>
        <Bold>{actor}</Bold> {middle} <Bold>{status}</Bold>
      </>
    )
  }

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

  // Company-specific event types are cast as `never` in the adapter but
  // arrive as plain strings at runtime.
  const eventTypeStr = eventType as unknown as string
  const COMPANY_EVENT_LABELS: Record<string, string> = {
    CREATED: reportText.timeline.companyCreated,
    FINES_STARTED: reportText.timeline.finesStarted,
    FINES_STOPPED: reportText.timeline.finesStopped,
    QUARANTINED: reportText.timeline.companyQuarantined,
    UNQUARANTINED: reportText.timeline.companyUnquarantined,
    EQUALITY_REPORT_DEADLINE_REMINDER_SENT:
      reportText.timeline.reminderSentEquality,
    SALARY_REPORT_DEADLINE_REMINDER_SENT:
      reportText.timeline.reminderSentSalary,
    EQUALITY_REPORT_DEADLINE_REMINDER_NO_EMAIL:
      reportText.timeline.reminderNoEmailEquality,
    SALARY_REPORT_DEADLINE_REMINDER_NO_EMAIL:
      reportText.timeline.reminderNoEmailSalary,
  }
  if (eventTypeStr in COMPANY_EVENT_LABELS) {
    return (
      <>
        {actorName && <Bold>{actorName} </Bold>}
        {COMPANY_EVENT_LABELS[eventTypeStr]}
      </>
    )
  }

  const FALLBACK: Partial<Record<ReportEventTypeEnum, string>> = {
    [ReportEventTypeEnum.SUPERSEDED]: reportText.timeline.superseded,
  }
  return FALLBACK[eventType] ?? eventType
}
