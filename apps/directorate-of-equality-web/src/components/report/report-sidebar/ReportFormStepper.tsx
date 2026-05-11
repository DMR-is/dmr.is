'use client'

import { FormStepper } from '@dmr.is/ui/components/island-is/FormStepper'
import { Section } from '@dmr.is/ui/components/island-is/Section'

import {
  ReportEventTypeEnum,
  ReportStatusEnum,
  ReportTimelineItemDto,
  ReportTimelineItemKindEnum,
  UserDto,
} from '../../../gen/fetch'
import {
  formatDateIS,
  ReportStatusTranslatedEnum,
} from '../../../lib/constants'
import { useTRPC } from '../../../lib/trpc/client/trpc'

import { useQuery } from '@tanstack/react-query'

type Props = {
  status: ReportStatusEnum
  timeline?: ReportTimelineItemDto[]
}

type Step = {
  label: string
  matchStatuses: ReportStatusEnum[]
}

function userName(user: UserDto): string {
  return `${user.firstName} ${user.lastName}`
}

function timelineLabel(
  item: ReportTimelineItemDto,
  usersById: Map<string, UserDto>,
): string {
  if (item.kind === ReportTimelineItemKindEnum.COMMENT && item.comment) {
    return 'Athugasemd'
  }
  if (item.event) {
    if (
      item.event.eventType === ReportEventTypeEnum.ASSIGNED &&
      item.event.assignedUserId
    ) {
      const user = usersById.get(item.event.assignedUserId)
      return user ? `Úthlutað: ${userName(user)}` : 'Úthlutað'
    }
    if (item.event.eventType === ReportEventTypeEnum.STATUS_CHANGED) {
      const statusLabel = item.event.toStatus
        ? ReportStatusTranslatedEnum[item.event.toStatus]
        : null
      const actor = item.event.actorUserId
        ? usersById.get(item.event.actorUserId)
        : null
      const parts = ['Fært í stöðuna']
      if (statusLabel) parts.push(`"${statusLabel}"`)
      if (actor) parts.push(`af ${userName(actor)}`)
      return parts.join(' ')
    }
    const EVENT_TYPE_LABEL: Record<ReportEventTypeEnum, string> = {
      [ReportEventTypeEnum.SUBMITTED]: 'Innsent',
      [ReportEventTypeEnum.ASSIGNED]: 'Úthlutað',
      [ReportEventTypeEnum.STATUS_CHANGED]: 'Stöðubreyting',
      [ReportEventTypeEnum.SUPERSEDED]: 'Úrelt',
    }
    return EVENT_TYPE_LABEL[item.event.eventType] ?? item.event.eventType
  }
  return ''
}

function timelineItemStatus(
  item: ReportTimelineItemDto,
): ReportStatusEnum | null {
  return item.event?.reportStatus ?? item.comment?.reportStatus ?? null
}

export const ReportFormStepper = ({ status, timeline }: Props) => {
  const trpc = useTRPC()
  const { data: users } = useQuery(trpc.user.listActive.queryOptions())
  const usersById = new Map((users ?? []).map((u) => [u.id, u]))
  const decisionLabel =
    status === ReportStatusEnum.DENIED
      ? ReportStatusTranslatedEnum.DENIED
      : 'Afgreitt'

  const statusSteps: Step[] = [
    {
      label: ReportStatusTranslatedEnum.SUBMITTED,
      matchStatuses: [ReportStatusEnum.SUBMITTED],
    },
    {
      label: ReportStatusTranslatedEnum.IN_REVIEW,
      matchStatuses: [ReportStatusEnum.IN_REVIEW],
    },
    {
      label: decisionLabel,
      matchStatuses: [ReportStatusEnum.APPROVED, ReportStatusEnum.DENIED],
    },
  ]

  const currentStepIndex = statusSteps.findIndex((s) =>
    s.matchStatuses.includes(status),
  )

  const sections = statusSteps.map((step, index) => {
    const stepItems = (timeline ?? []).filter((item) => {
      const s = timelineItemStatus(item)
      return s !== null && step.matchStatuses.includes(s)
    })

    const subSections = stepItems.map((item) => (
      <span style={{ fontSize: '12px' }}>
        {timelineLabel(item, usersById)}
        {' · '}
        {formatDateIS(item.createdAt)}
      </span>
    ))

    const isActive = step.matchStatuses.includes(status)
    const isComplete = index < currentStepIndex

    return (
      <Section
        key={step.label}
        section={step.label}
        sectionIndex={index}
        isActive={isActive || (isComplete && subSections.length > 0)}
        isComplete={isComplete}
        subSections={subSections.length > 0 ? subSections : undefined}
      />
    )
  })

  return <FormStepper sections={sections} />
}
