'use client'

import deepmerge from 'deepmerge'
import { useCallback, useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import {
  ApplicationTypeEnum,
  RecallApplicationWebSchema,
  recallBankruptcyAnswersRefined,
  recallDeceasedAnswersRefined,
} from '@dmr.is/legal-gazette/schemas'
import { getLogger } from '@dmr.is/logging-next'
import { Box } from '@dmr.is/ui/components/island-is/Box'

import { ApplicationShell } from '../components/application/ApplicationShell'
import { FormStep } from '../components/form-step/FormStep'
import { ApplicationDetailedDto } from '../gen/fetch'
import { useLocalFormStorage } from '../hooks/useLocalFormStorage'
import { useSubmitApplication } from '../hooks/useSubmitApplication'
import { recallForm } from '../lib/forms/recall/form'
import { RecallFormSteps } from '../lib/forms/recall/steps'
import { useTRPC } from '../lib/trpc/client/trpc'

import { useQuery } from '@tanstack/react-query'

const logger = getLogger('RecallFormContainer')

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

export const RecallFormContainer = ({ application }: Props) => {
  const trpc = useTRPC()
  const { data: baseEntities } = useQuery(trpc.getBaseEntities.queryOptions())

  const { loadFromStorage, clearStorage } = useLocalFormStorage(application.id)
  const { onValidSubmit, onInvalidSubmit } = useSubmitApplication(
    application.id,
  )

  const mappedType = mapApplicationType(application.type)
  const isBankruptcy = mappedType === ApplicationTypeEnum.RECALL_BANKRUPTCY

  const form = RecallFormSteps(mappedType)

  const metadata = {
    currentStep: application.currentStep,
    totalSteps: form.steps.length,
    applicationId: application.id,
    caseId: application.caseId,
    type: mappedType,
    isBankruptcy: isBankruptcy,
    courtOptions: baseEntities?.courtDistricts.map((court) => ({
      label: court.title,
      value: court.id,
    })) || [],
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

  // Hydrate form from localStorage on mount
  // This restores any unsaved changes if the user closed the browser
  useEffect(() => {
    const storedData = loadFromStorage()
    if (storedData) {
      logger.info('Hydrating form from localStorage', {
        applicationId: application.id,
      })

      const currentValues = methods.getValues()
      // Merge localStorage data with current form values (localStorage wins)
      const mergedValues = deepmerge(currentValues, storedData, {
        arrayMerge: (_dest, source) => source,
      }) as RecallApplicationWebSchema

      methods.reset(mergedValues)
    }
  }, [loadFromStorage, methods, application.id])

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

      // Clear localStorage before submitting - server sync will complete the process
      clearStorage()
      onValidSubmit()
    },
    [mappedType, methods, onValidSubmit, onInvalidSubmit, clearStorage],
  )

  const stepToRender = form.steps.at(application.currentStep)

  if (!stepToRender) {
    // eslint-disable-next-line no-console
    return null
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit, onInvalidSubmit)}>
        <ApplicationShell form={form} title={stepToRender.title}>
          <Box paddingY={[2, 3]}>
            <FormStep
              items={stepToRender.fields}
              loading={!methods.formState.isReady}
            />
          </Box>
        </ApplicationShell>
      </form>
    </FormProvider>
  )
}
