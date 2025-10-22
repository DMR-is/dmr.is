'use client'

import { useParams } from 'next/navigation'

import { FormStepper, Section } from '@dmr.is/ui/components/island-is'
import { formatDate } from '@dmr.is/utils/client'

import { StatusEnum } from '../../gen/fetch'
import { trpc } from '../../lib/trpc/client'

/**
 * Work in progress
 * TODO: update after we have added history tracking/comments to adverts
 */
export const AdvertFormStepper = () => {
  const { id } = useParams()
  const [advert] = trpc.adverts.getAdvert.useSuspenseQuery({ id: id as string })

  const statusTitle = advert.status.title

  let statusSteps = [
    { status: StatusEnum.Innsent },
    { status: StatusEnum.ÍVinnslu },
    { status: StatusEnum.TilbúiðTilÚtgáfu },
    { status: StatusEnum.ÚTgefið },
  ]

  // If advert has been rejected or cancelled, add that as the final step after "Innsent"
  const isRejectedOrCancelled =
    statusTitle === StatusEnum.Hafnað || statusTitle === StatusEnum.Afturkallað

  if (isRejectedOrCancelled) {
    const exceptionStep = {
      status: statusTitle as StatusEnum,
    }

    statusSteps = [statusSteps[0], statusSteps[1], exceptionStep]
  }

  const currentStepIndex = statusSteps.findIndex(
    (step) => step.status === statusTitle,
  )

  const sections = statusSteps.map((step, index) => {
    const isActive = index === currentStepIndex
    const isComplete = index < currentStepIndex

    // Build subSections
    const subSections = []
    if (step.status === StatusEnum.Innsent && (isActive || isComplete)) {
      if (advert.createdBy) {
        subSections.push(<div key="author">Innsent af: {advert.createdBy}</div>)
      }

      if (advert.createdAt) {
        subSections.push(
          <div key="date">
            Skráð þann: {formatDate(advert.createdAt, 'dd. MMMM yyyy')}
          </div>,
        )
      }
    }

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
