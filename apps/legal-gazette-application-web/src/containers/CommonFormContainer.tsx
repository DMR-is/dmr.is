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
import { ApplicationDetailedDto } from '../gen/fetch'
import { useSubmitApplication } from '../hooks/useSubmitApplication'
import { commonForm } from '../lib/forms/common-form'
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
      children: <PrerequisitesSteps id={application.id} />,
    },
    { title: 'Grunnupplýsingar', children: <AdvertStep /> },
    { title: 'Birtingarupplýsingar', children: <PublishingStep /> },
    { title: 'Forskoðun', children: <PreviewStep id={application.id} /> },
    { title: 'Samantekt', children: <SummaryStep application={application} /> },
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

  const itemToRender = items[application.currentStep]

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit, onInvalidSubmit)}>
        <ApplicationShell title={itemToRender.title}>
          <Box paddingY={[2, 3]}></Box>
          {itemToRender.children}
        </ApplicationShell>
      </form>
    </FormProvider>
  )
}
