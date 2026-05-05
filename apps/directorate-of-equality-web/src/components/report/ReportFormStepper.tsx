'use client'

import z from 'zod'

import { useQuery, useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import { FormStepper } from '@dmr.is/ui/components/island-is/FormStepper'
import { Section } from '@dmr.is/ui/components/island-is/Section'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { zReportStatusEnum } from '../../gen/fetch/zod.gen'
import { useTRPC } from '../../lib/trpc/client/trpc'
type Props = {
  id: string
}

export const ReportFormStepper = ({ id }: Props) => {
  const trpc = useTRPC()
  const { data: report } = useQuery(trpc.reports.getById.queryOptions({ id }))

  const statusTitle = report?.status

  const statusSteps: { status: z.infer<typeof zReportStatusEnum> }[] = [
    { status: zReportStatusEnum.enum.SUBMITTED },
    { status: zReportStatusEnum.enum.IN_REVIEW },
    { status: zReportStatusEnum.enum.APPROVED },
    { status: zReportStatusEnum.enum.DENIED },
    { status: zReportStatusEnum.enum.SUPERSEDED },
  ]

  if (statusTitle === zReportStatusEnum.enum.SUBMITTED) {
    statusSteps.push({ status: zReportStatusEnum.enum.SUBMITTED })
  } else if (statusTitle === zReportStatusEnum.enum.IN_REVIEW) {
    statusSteps.push({ status: zReportStatusEnum.enum.IN_REVIEW })
  } else if (statusTitle === zReportStatusEnum.enum.DENIED) {
    statusSteps.push({ status: zReportStatusEnum.enum.DENIED })
  } else if (statusTitle === zReportStatusEnum.enum.APPROVED) {
    statusSteps.push({ status: zReportStatusEnum.enum.APPROVED })
  } else {
    statusSteps.push({ status: zReportStatusEnum.enum.SUPERSEDED })
  }

  const sections = statusSteps.map((step, index) => {
    const isActive = step.status === statusTitle
    const currentStepIndex = statusSteps.findIndex(
      (s) => s.status === statusTitle,
    )
    const isComplete = index < currentStepIndex

    const commentsForStep = report?.timeline
      .filter((item) => item.comment?.reportStatus === step.status)
      .map((item) => ({
        date: item.createdAt,
        title: item.comment?.body ?? '',
      }))

    const subSections = commentsForStep?.map((c) => (
      <Stack space={0}>
        <Text variant="small">{c.date}</Text>
        <Text variant="small" fontWeight="medium">
          {c.title}
        </Text>
      </Stack>
    ))
    return (
      <Section
        key={step.status}
        section={step.status}
        sectionIndex={index}
        isActive={isActive}
        isComplete={isComplete}
        subSections={subSections}
      />
    )
  })

  return <FormStepper sections={sections} />
}
