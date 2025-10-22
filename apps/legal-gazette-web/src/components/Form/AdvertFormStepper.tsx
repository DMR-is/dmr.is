'use client'

import {
  FormStepper,
  Section,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { AdvertDetailedDto, CommentDto, StatusEnum } from '../../gen/fetch'
import { trpc } from '../../lib/trpc/client'
import { commentStepperMapper } from '../../mappers/commentMapper'

type Props = {
  advert: AdvertDetailedDto
  comments: CommentDto[]
}

export const AdvertFormStepper = ({ advert, comments }: Props) => {
  const { data } = trpc.commentsApi.getComments.useQuery(
    { advertId: advert.id },
    { initialData: { comments: comments } },
  )

  const statusTitle = advert.status.title

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

    const commentsForStep = data.comments
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
