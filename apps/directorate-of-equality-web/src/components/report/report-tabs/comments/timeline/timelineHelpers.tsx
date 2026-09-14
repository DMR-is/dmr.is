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

/**
 * Fills the `{company}` slot in a label with the company's name, bolded.
 *
 * Exists so an actorless company event still opens with a bold subject — the
 * feed's other entries all start with a bold name, and a row that begins with
 * plain text reads as a fragment next to them.
 *
 * A null name drops the placeholder AND the space in front of it, so every
 * template carrying the slot has to still read as a sentence without it
 * ("Fyrirtæki {company} skráð" → "Fyrirtæki skráð"). That case is not
 * hypothetical: only the company timeline passes a name, so any other caller
 * of these labels gets the shorter form.
 *
 * ⚠️ A template with NO slot renders unchanged, and that guard is the whole
 * reason this returns early. Without it, `split` left the label in `before`
 * and an empty `after`, so a name was appended to the END of the sentence with
 * nothing between them — "Aðgangslykill búinn tilAcme ehf." Every actorless
 * company label reaches this function whether or not it declares a slot, so
 * the no-slot case has to be a decision rather than a fallthrough.
 */
function withCompanyName(
  template: string,
  companyName?: string | null,
): React.ReactNode {
  const [before, after] = template.split('{company}')

  if (after === undefined) {
    return <>{template}</>
  }

  if (!companyName) {
    return <>{`${before.replace(/ $/, '')}${after}`}</>
  }

  return (
    <>
      {before}
      <Bold>{companyName}</Bold>
      {after}
    </>
  )
}

export type TimelineEntryKind = 'event' | 'outgoing' | 'incoming' | 'internal'

/**
 * What the feed actually renders: the generated timeline DTO plus display-only
 * fields one caller has and the other does not.
 *
 * The feed is shared by the report timeline and the company timeline, whose
 * backend DTOs differ — `CompanyTimeline` already adapts its items into the
 * report shape. `isSystem` is the one company-comment field with no counterpart
 * on a report comment, and it is optional here so a plain
 * `ReportTimelineItemDto` stays assignable and the report side needs no change.
 *
 * ⚠️ It has to be its own field rather than inferred from a null
 * `authorUserId`: null means "no user attached", which is also true of a
 * comment whose author we simply do not know. See `company_comment.is_system`.
 */
export type TimelineItem = Omit<ReportTimelineItemDto, 'comment' | 'event'> & {
  comment?:
    | (NonNullable<ReportTimelineItemDto['comment']> & { isSystem?: boolean })
    | null
  /**
   * `scope` says which entity the event is about, and it cannot be inferred.
   *
   * `CompanyTimeline` adapts company events into the report event shape, and
   * the two share the `STATUS_CHANGED` type while meaning different things: a
   * report moves through review, a company moves on or off the register. With
   * no discriminator the renderer read a company event as a report one and
   * printed "færir mál í stöðuna:" followed by nothing, because ACTIVE and
   * INACTIVE are not members of `ReportStatusTranslatedEnum`.
   *
   * Optional and defaulting to report scope, so a plain `ReportTimelineItemDto`
   * stays assignable and the report side needs no change — same arrangement as
   * `isSystem` above.
   */
  event?:
    | (NonNullable<ReportTimelineItemDto['event']> & {
        scope?: 'report' | 'company'
        /**
         * Set on CUSTOM_EMAIL_* company events only, and what makes the entry
         * expandable. Optional and absent on every report event, same
         * arrangement as `scope` and `isSystem`.
         */
        companyEmailId?: string | null
      })
    | null
}

export function timelineEntryKind(item: TimelineItem): TimelineEntryKind {
  if (item.kind === ReportTimelineItemKindEnum.EVENT) return 'event'
  if (item.comment?.authorKind === ReportRoleEnum.COMPANY) return 'incoming'
  if (item.comment?.visibility === CommentVisibilityEnum.INTERNAL)
    return 'internal'
  return 'outgoing'
}

export function timelineEntryText(
  item: TimelineItem,
  companyName?: string | null,
): React.ReactNode {
  if (item.kind === ReportTimelineItemKindEnum.COMMENT) {
    const comment = item.comment

    // A system-written note gets its own verb: it did not "register a message",
    // it made a remark. Checked before the author fallbacks, which would
    // otherwise render it as an unnamed member of staff.
    if (comment?.isSystem) {
      return (
        <>
          <Bold>{reportText.timeline.system}</Bold>{' '}
          {reportText.timeline.makesComment}
        </>
      )
    }

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

  const {
    eventType,
    actorName,
    assignedUserName,
    toStatus,
    systemDecision,
    scope,
  } = item.event

  /**
   * Company events come in two shapes: with an actor (an admin did it) and
   * without (the register import, or a company issuing its own key through
   * island.is, which records no `doe_user`). The renderer prints the name and
   * then the label, so the two cases need different labels — a verb phrase
   * that continues the sentence, or a passive one that stands alone.
   */
  const actorLine = (withActor: string, withoutActor: string) =>
    actorName ? (
      <>
        <Bold>{actorName} </Bold>
        {withActor}
      </>
    ) : (
      withCompanyName(withoutActor, companyName)
    )

  // Before the report branch below: company events reuse STATUS_CHANGED but
  // mean the register lifecycle, whose values are not report statuses.
  if (scope === 'company' && eventType === ReportEventTypeEnum.STATUS_CHANGED) {
    const activated = (toStatus as unknown as string) === 'ACTIVE'

    return actorLine(
      activated
        ? reportText.timeline.companyActivated
        : reportText.timeline.companyDeactivated,
      activated
        ? reportText.timeline.companyActivatedNoActor
        : reportText.timeline.companyDeactivatedNoActor,
    )
  }

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

  if (eventType === ReportEventTypeEnum.EDITED) {
    return (
      <>
        {actorName && <Bold>{actorName} </Bold>}
        {reportText.timeline.edited}
      </>
    )
  }

  if (eventType === ReportEventTypeEnum.COMMUNICATION_OPENED) {
    return (
      <>
        {actorName && <Bold>{actorName} </Bold>}
        {reportText.timeline.communicationOpened}
      </>
    )
  }

  if (eventType === ReportEventTypeEnum.COMMUNICATION_CLOSED) {
    return (
      <>
        {actorName && <Bold>{actorName} </Bold>}
        {reportText.timeline.communicationClosed}
      </>
    )
  }

  // Company-specific event types are cast as `never` in the adapter but
  // arrive as plain strings at runtime.
  const eventTypeStr = eventType as unknown as string
  // Events whose wording works with or without a name in front of it: the
  // fines and quarantine switches are always admin-driven, and the reminder
  // events are always the system's. Anything that can arrive both ways belongs
  // in COMPANY_EVENT_ACTOR_LABELS below instead.
  const COMPANY_EVENT_LABELS: Record<string, string> = {
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
  const COMPANY_EVENT_ACTOR_LABELS: Record<string, [string, string]> = {
    API_KEY_ISSUED: [
      reportText.timeline.apiKeyIssued,
      reportText.timeline.apiKeyIssuedNoActor,
    ],
    API_KEY_REVOKED: [
      reportText.timeline.apiKeyRevoked,
      reportText.timeline.apiKeyRevokedNoActor,
    ],
    CREATED: [
      reportText.timeline.companyCreated,
      reportText.timeline.companyCreatedNoActor,
    ],
    // Actor-aware: the sending reviewer is carried onto every recipient's event.
    // The no-actor wording covers a batch whose sender's user row has gone.
    CUSTOM_EMAIL_SENT: [
      reportText.timeline.customEmailSent,
      reportText.timeline.customEmailSentNoActor,
    ],
    CUSTOM_EMAIL_FAILED: [
      reportText.timeline.customEmailFailed,
      reportText.timeline.customEmailFailedNoActor,
    ],
    CUSTOM_EMAIL_SKIPPED: [
      reportText.timeline.customEmailSkipped,
      reportText.timeline.customEmailSkippedNoActor,
    ],
  }
  if (eventTypeStr in COMPANY_EVENT_ACTOR_LABELS) {
    const [withActor, withoutActor] = COMPANY_EVENT_ACTOR_LABELS[eventTypeStr]
    return actorLine(withActor, withoutActor)
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
