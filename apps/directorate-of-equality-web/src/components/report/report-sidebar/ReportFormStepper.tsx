'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { FormStepper } from '@dmr.is/ui/components/island-is/FormStepper'
import { Section } from '@dmr.is/ui/components/island-is/Section'

import { ReportStatusEnum } from '../../../gen/fetch'
import { ReportStatusTranslatedEnum } from '../../../lib/constants'
import { reportText } from '../../../lib/text'

type Props = {
  status: ReportStatusEnum
}

type Step = {
  label: string
  matchStatuses: ReportStatusEnum[]
}

export const ReportFormStepper = ({ status }: Props) => {
  const decisionLabel =
    status === ReportStatusEnum.DENIED
      ? ReportStatusTranslatedEnum.DENIED
      : reportText.stepApproved

  const steps: Step[] = [
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

  const currentStepIndex = steps.findIndex((s) =>
    s.matchStatuses.includes(status),
  )

  return (
    <Box marginLeft={3}>
      <FormStepper
        sections={steps.map((step, index) => (
          <Section
            key={step.label}
            section={step.label}
            sectionIndex={index}
            isActive={step.matchStatuses.includes(status)}
            isComplete={index < currentStepIndex}
          />
        ))}
      />
    </Box>
  )
}
