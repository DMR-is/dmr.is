'use client'

import { useCallback } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import {
  ApplicationTypeEnum,
  commonApplicationAnswersRefined,
  CommonApplicationWebSchema,
} from '@dmr.is/legal-gazette/schemas'
import { Box } from '@dmr.is/ui/components/island-is'

import { ApplicationShell } from '../components/application/ApplicationShell'
import { AdvertStep } from '../components/form/common/steps/AdvertStep'
import { PublishingStep } from '../components/form/common/steps/PublishingStep'
import { PrerequisitesSteps } from '../components/form/steps/PrequesitesSteps'
import { PreviewStep } from '../components/form/steps/PreviewStep'
import { SummaryStep } from '../components/form/steps/SummaryStep'
import { FormStep } from '../components/form-step/FormStep'
import { ApplicationDetailedDto } from '../gen/fetch'
import { useSubmitApplication } from '../hooks/useSubmitApplication'
import { commonForm } from '../lib/forms/common/form'
import { CommonForm } from '../lib/forms/common/steps'
import { useTRPC } from '../lib/trpc/client/trpc'

import { useQuery, useSuspenseQuery } from '@tanstack/react-query'

type Props = {
  application: ApplicationDetailedDto
}

export const CommonFormContainer = ({
  application: initalApplication,
}: Props) => {
  const trpc = useTRPC()
  const { data: baseEntities } = useSuspenseQuery(
    trpc.getBaseEntities.queryOptions(),
  )

  const { data: application } = useQuery(
    trpc.getApplicationById.queryOptions(
      { id: initalApplication.id },
      { initialData: initalApplication },
    ),
  )

  const { onValidSubmit, onInvalidSubmit } = useSubmitApplication(
    application.id,
  )

  const items = [
    {
      title: 'Skilyrði fyrir birtingu',
      children: <PrerequisitesSteps />,
    },
    { title: 'Grunnupplýsingar', children: <AdvertStep /> },
    { title: 'Birtingarupplýsingar', children: <PublishingStep /> },
    { title: 'Forskoðun', children: <PreviewStep /> },
    { title: 'Samantekt', children: <SummaryStep /> },
  ]

  const metadata = {
    currentStep: application.currentStep,
    totalSteps: items.length,
    applicationId: application.id,
    caseId: application.caseId,
    type: ApplicationTypeEnum.COMMON,
    isBankruptcy: false,
    typeOptions: baseEntities.types.map((type) => ({
      label: type.title,
      value: type,
    })),
  }

  const methods = useForm<CommonApplicationWebSchema>(
    commonForm({
      metadata,
      application: {
        type: ApplicationTypeEnum.COMMON,
        ...application.answers,
      },
    }),
  )
  const onSubmit = useCallback(
    (_data: CommonApplicationWebSchema) => {
      // Manually get the values to ensure we have the latest state
      const data = methods.getValues()
      const check = commonApplicationAnswersRefined.safeParse(data)

      if (!check.success) {
        check.error.issues.forEach((issue) => {
          methods.setError(issue.path.join('.') as any, {
            message: issue.message,
          })
        })
        return onInvalidSubmit(data)
      }

      onValidSubmit()
    },
    [methods, onValidSubmit, onInvalidSubmit],
  )

  const stepToRender = CommonForm.steps.at(application.currentStep)

  if (!stepToRender) {
    // eslint-disable-next-line no-console
    console.error('No step found for current step:', application.currentStep)
    return null
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit, onInvalidSubmit)}>
        <ApplicationShell form={CommonForm} title={stepToRender.title}>
          <Box paddingY={[2, 3]}>
            <FormStep items={stepToRender.fields} />
          </Box>
        </ApplicationShell>
      </form>
    </FormProvider>
  )
}
