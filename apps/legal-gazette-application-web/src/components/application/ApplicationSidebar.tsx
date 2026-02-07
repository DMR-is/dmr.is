'use client'
import { useFormContext } from 'react-hook-form'

import { BaseApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'
import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { FormStepper } from '@dmr.is/ui/components/island-is/FormStepper'
import { Section } from '@dmr.is/ui/components/island-is/Section'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'

import { LegalGazetteForm } from '../../lib/forms/types'
import { useTRPC } from '../../lib/trpc/client/trpc'
import * as styles from './application.css'

type Props = {
  form: LegalGazetteForm
}

export const ApplicationSidebar = ({ form }: Props) => {
  const trpc = useTRPC()

  const { getValues } = useFormContext<BaseApplicationWebSchema>()
  const id = getValues('metadata.applicationId')

  const { data: application, isPending } = useQuery(
    trpc.getApplicationById.queryOptions({ id: id }),
  )

  if (isPending) {
    return (
      <SkeletonLoader
        repeat={5}
        height={44}
        space={1}
        borderRadius="standard"
      />
    )
  }

  const currentStep = application?.currentStep ?? 0

  const sections = form.steps.map((step, i) => {
    const isActive = i === currentStep
    const isComplete = i < currentStep

    return (
      <Section
        key={step.stepTitle}
        section={step.stepTitle}
        isActive={isActive}
        isComplete={isComplete}
        sectionIndex={i}
      />
    )
  })

  return (
    <Box className={styles.sidebarStyles}>
      <FormStepper sections={sections} />
    </Box>
  )
}
