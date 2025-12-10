/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Button,
  Inline,
  LinkV2,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { useSubmitApplication } from '../../../hooks/useSubmitApplication'
import { PageRoutes } from '../../../lib/constants'
import { recallForm, RecallFormProps } from '../../../lib/forms/recall-form'
import { ApplicationShell } from '../../application/ApplicationShell'
import { CommunicationChannelFields } from '../fields/CommunicationChannelFields'
import { PublishingFields } from '../fields/PublishingFields'
import { SignatureFields } from '../fields/SignatureFields'
import { RecallAdvertFields } from './fields/RecallAdvertFields'
import { RecallDivisionFields } from './fields/RecallDivisionFields'
import { RecallLiquidatorFields } from './fields/RecallLiquidatorFields'
import { RecallRequirementStatementFields } from './fields/RecallRequirementStatementFields'
import { RecallSettlementFields } from './fields/settlement/RecallSettlementFields'

export const RecallForm = (props: RecallFormProps) => {
  const methods = useForm<RecallApplicationWebSchema>(recallForm(props))

  const { onValidSubmit, onInvalidSubmit } = useSubmitApplication(
    props.metadata.applicationId,
  )

  const isBankruptcy =
    props.application.type === ApplicationTypeEnum.RECALL_BANKRUPTCY

  const onSubmit = useCallback(
    (_data: RecallApplicationWebSchema) => {
      // Manually get values to ensure we have the latest data
      const data = methods.getValues()

      if (isBankruptcy) {
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
    [isBankruptcy, methods, onValidSubmit, onInvalidSubmit],
  )

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit, onInvalidSubmit)}>
        <ApplicationShell>
          <Stack space={[2, 3, 4]}>
            <Stack space={[1, 2]}>
              <Inline justifyContent="spaceBetween" alignY="top">
                <Text variant="h2">
                  Innköllun {isBankruptcy ? 'þrotabús' : 'dánarbús'}
                </Text>
                <LinkV2 href={PageRoutes.APPLICATIONS}>
                  <Button preTextIcon="arrowBack" variant="text" size="small">
                    Tilbaka í umsóknir
                  </Button>
                </LinkV2>
              </Inline>
              <Text>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.
              </Text>
            </Stack>
            <RecallAdvertFields />
            <RecallSettlementFields />
            <RecallLiquidatorFields />
            <RecallRequirementStatementFields />
            <PublishingFields
              additionalTitle="innköllunar"
              applicationType="RECALL"
            />
            <RecallDivisionFields isBankruptcy={isBankruptcy} />
            <SignatureFields />
            <CommunicationChannelFields />
          </Stack>
        </ApplicationShell>
      </form>
    </FormProvider>
  )
}
