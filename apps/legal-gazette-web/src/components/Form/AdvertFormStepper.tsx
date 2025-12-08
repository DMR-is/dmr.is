'use client'

import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import {
  FormStepper,
  Section,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { StatusEnum } from '../../lib/constants'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { commentStepperMapper } from '../../mappers/commentMapper'

type Props = {
  id: string
}

export const AdvertFormStepper = ({ id }: Props) => {
  const trpc = useTRPC()
  const { data: advert } = useSuspenseQuery(trpc.getAdvert.queryOptions({ id }))

  const statusTitle = advert?.status.title

  const statusSteps: { status: StatusEnum }[] = [
    { status: StatusEnum.SUBMITTED },
    { status: StatusEnum.IN_PROGRESS },
    { status: StatusEnum.READY_FOR_PUBLICATION },
  ]

  if (statusTitle === StatusEnum.REJECTED) {
    statusSteps.push({ status: StatusEnum.REJECTED })
  } else if (statusTitle === StatusEnum.REVOKED) {
    statusSteps.push({ status: StatusEnum.REVOKED })
  } else {
    statusSteps.push({ status: StatusEnum.PUBLISHED })
  }

  const sections = statusSteps.map((step, index) => {
    const isActive = step.status === statusTitle
    const currentStepIndex = statusSteps.findIndex(
      (s) => s.status === statusTitle,
    )
    const isComplete = index < currentStepIndex

    const commentsForStep = advert.comments
      .map((comment) =>
        comment.status.title === step.status
          ? commentStepperMapper(comment)
          : null,
      )
      .filter((c) => c !== null)

    const subSections = commentsForStep.map((c) => (
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
