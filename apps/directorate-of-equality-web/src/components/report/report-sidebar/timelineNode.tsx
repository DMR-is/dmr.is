'use client'

import {
  ReportEventTypeEnum,
  ReportTimelineItemDto,
  ReportTimelineItemKindEnum,
  UserDto,
} from '../../../gen/fetch'
import { ReportStatusTranslatedEnum } from '../../../lib/constants'

export function Bold({ children }: { children: React.ReactNode }) {
  return <strong style={{ fontWeight: 600 }}>{children}</strong>
}

export function userName(user: UserDto): string {
  return `${user.firstName === 'Gervimaður' ? 'GM' : user.firstName} ${user.lastName}`
}

export function timelineItemStatus(
  item: ReportTimelineItemDto,
): import('../../../gen/fetch').ReportStatusEnum | null {
  return item.event?.reportStatus ?? item.comment?.reportStatus ?? null
}

export function timelineNode(
  item: ReportTimelineItemDto,
  usersById: Map<string, UserDto>,
  companyName?: string | null,
): React.ReactNode {
  if (item.kind === ReportTimelineItemKindEnum.COMMENT) {
    const user = usersById.get(item.comment?.authorUserId ?? '')
    const fullName = user
      ? `${user.firstName === 'Gervimaður' ? 'GM' : user.firstName} ${user.lastName}`
      : 'Óþekktum notanda'
    return <>Athugasemd frá: <Bold>{fullName}</Bold></>
  }

  if (!item.event) return null

  const { eventType, assignedUserId, actorUserId, toStatus } = item.event

  if (eventType === ReportEventTypeEnum.SUBMITTED) {
    return companyName ? <>Innsent af: <Bold>{companyName}</Bold></> : 'Innsent'
  }

  if (eventType === ReportEventTypeEnum.ASSIGNED && assignedUserId) {
    const user = usersById.get(assignedUserId)
    return user ? <><Bold>{userName(user)}</Bold> merkir sér málið</> : 'Úthlutað'
  }

  if (eventType === ReportEventTypeEnum.STATUS_CHANGED) {
    const statusLabel = toStatus ? ReportStatusTranslatedEnum[toStatus] : null
    const actor = actorUserId ? usersById.get(actorUserId) : null
    return (
      <>
        {actor && <><Bold>{userName(actor)}</Bold>{' '}</>}
        færir mál í stöðuna: {statusLabel ? <Bold>{statusLabel}</Bold> : null}
      </>
    )
  }

  if (eventType === ReportEventTypeEnum.UNASSIGNED) {
    const actor = actorUserId ? usersById.get(actorUserId) : null
    return (
      <>
        {actor && <><Bold>{userName(actor)}</Bold>{' '}</>}
        tekur sig af málinu
      </>
    )
  }

  const FALLBACK: Partial<Record<ReportEventTypeEnum, string>> = {
    [ReportEventTypeEnum.SUPERSEDED]: 'Úrelt',
  }
  return FALLBACK[eventType] ?? eventType
}
