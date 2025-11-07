'use client'

import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import {
  FormStepper,
  Section,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { StatusEnum } from '../../gen/fetch'
import {  useTRPC } from '../../lib/trpc/client/trpc'
import { commentStepperMapper } from '../../mappers/commentMapper'

type Props = {
  id: string
}
export const AdvertFormStepper = ({ id }: Props) => {
  const trpc = useTRPC()
  const { data: advert } = useSuspenseQuery(trpc.getAdvert.queryOptions({ id }))

  const statusTitle = advert?.status.title

  const statusSteps = [
    { status: StatusEnum.Innsent },
    { status: StatusEnum.ÍVinnslu },
    { status: StatusEnum.TilbúiðTilÚtgáfu },
  ]

  if (statusTitle === StatusEnum.Hafnað) {
    statusSteps.push({ status: StatusEnum.Hafnað })
  } else if (statusTitle === StatusEnum.Afturkallað) {
    statusSteps.push({ status: StatusEnum.Afturkallað })
  } else {
    statusSteps.push({ status: StatusEnum.ÚTgefið })
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
