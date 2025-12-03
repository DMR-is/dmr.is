'use client'

import { useCallback } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import {
  ApplicationTypeEnum,
  RecallApplicationWebSchema,
  recallBankruptcyAnswersRefined,
  recallDeceasedAnswersRefined,
} from '@dmr.is/legal-gazette/schemas'
import {
  AlertMessage,
  Stack,
  Text,
  toast,
} from '@dmr.is/ui/components/island-is'

import { useSubmitApplication } from '../../../hooks/useSubmitApplication'
import { recallForm, RecallFormProps } from '../../../lib/forms/recall-form'
import { ApplicationShell } from '../../application/ApplicationShell'
import { CommunicationChannelFields } from '../fields/CommunicationChannelFields'
import { PublishingFields } from '../fields/PublishingFields'
import { SignatureFields } from '../fields/SignatureFields'
import { RecallAdvertFields } from './fields/RecallAdvertFields'
import { RecallDivisionFields } from './fields/RecallDivisionFields'
import { RecallLiquidatorFields } from './fields/RecallLiquidatorFields'
import { RecallRequirementStatementFields } from './fields/RecallRequirementStatementFields'
import { RecallSettlementFields } from './fields/RecallSettlementFields'

export const RecallForm = (props: RecallFormProps) => {
  const methods = useForm<RecallApplicationWebSchema>(recallForm(props))

  const { onValidSubmit, onInvalidSubmit } = useSubmitApplication(
    props.metadata.applicationId,
  )

  const isBankruptcy =
    props.application.type === ApplicationTypeEnum.RECALL_BANKRUPTCY

  const onSubmit = useCallback((data: RecallApplicationWebSchema) => {
    if (isBankruptcy) {
      const bankruptcyCheck = recallBankruptcyAnswersRefined.safeParse(data)

      if (!bankruptcyCheck.success) {
        bankruptcyCheck.error.issues.forEach((issue) => {
          methods.setError(issue.path.join('.') as any, {
            message: issue.message,
          })
        })
      }

      return onInvalidSubmit(data)
    }

    const deceasedCheck = recallDeceasedAnswersRefined.safeParse(data)

    if (!deceasedCheck.success) {
      deceasedCheck.error.issues.forEach((issue) => {
        methods.setError(issue.path.join('.') as any, {
          message: issue.message,
        })
      })

      return onInvalidSubmit(data)
    }

    onValidSubmit()
  }, [])

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit, onInvalidSubmit)}>
        <ApplicationShell>
          <Stack space={[2, 3, 4]}>
            <Stack space={[1, 2]}>
              <Text variant="h2">
                Innköllun {isBankruptcy ? 'þrotabús' : 'dánarbús'}
              </Text>
              <Text>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.
              </Text>
            </Stack>
            <RecallAdvertFields />
            <RecallSettlementFields isBankruptcy={isBankruptcy} />
            <RecallLiquidatorFields />
            <RecallRequirementStatementFields />
            <PublishingFields additionalTitle="innköllunar" />
            <RecallDivisionFields isBankruptcy={isBankruptcy} />
            <SignatureFields />
            <CommunicationChannelFields />
          </Stack>
        </ApplicationShell>
      </form>
    </FormProvider>
  )
}
