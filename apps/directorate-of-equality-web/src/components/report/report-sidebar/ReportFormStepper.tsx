'use client'

import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'

import { ReportStatusEnum, ReportTimelineItemDto } from '../../../gen/fetch'
import { ReportStatusTranslatedEnum } from '../../../lib/constants'
import { useTRPC } from '../../../lib/trpc/client/trpc'
import { StepRow } from './StepRow'
import { timelineItemStatus } from './timelineNode'

import { useQuery } from '@tanstack/react-query'

type Props = {
  status: ReportStatusEnum
  timeline?: ReportTimelineItemDto[]
  companyName?: string | null
}

type Step = {
  label: string
  matchStatuses: ReportStatusEnum[]
}

export const ReportFormStepper = ({ status, timeline, companyName }: Props) => {
  const trpc = useTRPC()
  const { data: users } = useQuery(trpc.user.listActive.queryOptions())
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())

  const usersById = new Map((users ?? []).map((u) => [u.id, u]))

  const toggleCollapsed = (index: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })

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

  return (
    <Box>
      {statusSteps.map((step, index) => {
        const stepItems = (timeline ?? []).filter((item) => {
          const s = timelineItemStatus(item)
          return s !== null && step.matchStatuses.includes(s)
        })

        return (
          <StepRow
            key={step.label}
            label={step.label}
            index={index}
            isActive={step.matchStatuses.includes(status)}
            isComplete={index < currentStepIndex}
            isLast={index === statusSteps.length - 1}
            isCollapsed={collapsed.has(index)}
            stepItems={stepItems}
            usersById={usersById}
            companyName={companyName}
            onToggle={() => toggleCollapsed(index)}
          />
        )
      })}
    </Box>
  )
}
