'use client'

import { useCallback } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import {
  ApplicationTypeEnum,
  RecallApplicationWebSchema,
  recallBankruptcyAnswersRefined,
  recallDeceasedAnswersRefined,
} from '@dmr.is/legal-gazette/schemas'
import { Box } from '@dmr.is/ui/components/island-is'

import { ApplicationShell } from '../components/application/ApplicationShell'
import { AdvertStep } from '../components/form/recall/steps/AdvertStep'
import { PublishingStep } from '../components/form/recall/steps/PublishingStep'
import { SettlementStep } from '../components/form/recall/steps/SettlementStep'
import { PrerequisitesSteps } from '../components/form/steps/PrequesitesSteps'
import { ApplicationDetailedDto } from '../gen/fetch'
import { useSubmitApplication } from '../hooks/useSubmitApplication'
import { recallForm } from '../lib/forms/recall-form'
import { useTRPC } from '../lib/trpc/client/trpc'

import { useQuery, useSuspenseQuery } from '@tanstack/react-query'

type Props = {
  application: ApplicationDetailedDto
}

const mapApplicationType = (
  type: string,
):
  | ApplicationTypeEnum.RECALL_BANKRUPTCY
  | ApplicationTypeEnum.RECALL_DECEASED => {
  switch (type) {
    case 'RECALL_BANKRUPTCY':
      return ApplicationTypeEnum.RECALL_BANKRUPTCY
    case 'RECALL_DECEASED':
      return ApplicationTypeEnum.RECALL_DECEASED
    default:
      throw new Error('Unsupported application type for recall form')
  }
}

export const RecallFormContainer = ({
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

  const mappedType = mapApplicationType(application.type)
  const isBankruptcy = mappedType === ApplicationTypeEnum.RECALL_BANKRUPTCY

  const items = [
    {
      title: 'Skilyrði fyrir birtingu',
      children: <PrerequisitesSteps id={application.id} />,
    },
    { title: 'Grunnupplýsingar', children: <AdvertStep /> },
    {
      title: isBankruptcy
        ? 'Upplýsingar um þrotabúið'
        : 'Upplýsingar um dánarbúið',
      children: <SettlementStep />,
    },
    { title: 'Birting og samskiptaleiðir', children: <PublishingStep /> },
  ]

  const metadata = {
    currentStep: application.currentStep,
    totalSteps: items.length,
    applicationId: application.id,
    caseId: application.caseId,
    type: mappedType,
    isBankruptcy: isBankruptcy,
    courtOptions: baseEntities.courtDistricts.map((court) => ({
      label: court.title,
      value: court.id,
    })),
  }

  const methods = useForm<RecallApplicationWebSchema>(
    recallForm({
      metadata: metadata,
      application: {
        type: mappedType,
        ...application.answers,
      },
    }),
  )

  const onSubmit = useCallback(
    (_data: RecallApplicationWebSchema) => {
      // Manually get values to ensure we have the latest data
      const data = methods.getValues()

      if (mappedType === ApplicationTypeEnum.RECALL_BANKRUPTCY) {
        const bankruptcyCheck = recallBankruptcyAnswersRefined.safeParse(data)

        if (!bankruptcyCheck.success) {
          bankruptcyCheck.error.issues.forEach((issue) => {
            methods.setError(issue.path.join('.') as any, {
              message: issue.message,
            })
          })

          return onInvalidSubmit(data)
        }
      } else {
        const deceasedCheck = recallDeceasedAnswersRefined.safeParse(data)

        if (!deceasedCheck.success) {
          deceasedCheck.error.issues.forEach((issue) => {
            methods.setError(issue.path.join('.') as any, {
              message: issue.message,
            })
          })

          return onInvalidSubmit(data)
        }
      }

      onValidSubmit()
    },
    [mappedType, methods, onValidSubmit, onInvalidSubmit],
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
