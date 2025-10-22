'use client'

import { FormStepper, Section, Text } from '@dmr.is/ui/components/island-is'

import { AdvertDetailedDto, CommentDto, StatusEnum } from '../../gen/fetch'
import { commentStepperMapper } from '../../mappers/commentMapper'

type Props = {
  advert: AdvertDetailedDto
  comments: CommentDto[]
}

export const AdvertFormStepper = ({ advert, comments }: Props) => {
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

    const commentsForStep = comments
      .map((comment) =>
        comment.status.title === step.status
          ? commentStepperMapper(comment)
          : null,
      )
      .filter((c): c is string => c !== null)

    const subSections = commentsForStep.map((c) => (
      <Text variant="small" fontWeight="medium">
        {c}
      </Text>
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
