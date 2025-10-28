'use client'

import { FormProvider, useForm } from 'react-hook-form'

import { Stack, Text } from '@island.is/island-ui/core'

import { useSubmitApplication } from '../../../../hooks/useSubmitApplication'
import { recallForm } from '../../../../lib/forms/recall-form'
import {
  RecallFormFieldsSchema,
  RecallFormSchema,
} from '../../../../lib/forms/schemas/recall-schema'
import { ApplicationShell } from '../../application/ApplicationShell'
import { CommunicationChannelFields } from '../fields/CommunicationChannelFields'
import { PublishingFields } from '../fields/PublishingFields'
import { SignatureFields } from '../fields/SignatureFields'
import { RecallAdvertFields } from './fields/RecallAdvertFields'
import { RecallDivisionFields } from './fields/RecallDivisionFields'
import { RecallLiquidatorFields } from './fields/RecallLiquidatorFields'
import { RecallSettlementFields } from './fields/RecallSettlementFields'

type Props = {
  caseId: string
  applicationId: string
  courtOptions: { label: string; value: string }[]
  fields: Partial<RecallFormFieldsSchema>
}

export const RecallForm = ({
  caseId,
  applicationId,
  courtOptions,
  fields,
}: Props) => {
  const methods = useForm<RecallFormSchema>(
    recallForm({
      caseId: caseId,
      applicationId: applicationId,
      courtOptions: courtOptions,
      fields: fields,
    }),
  )

  const { onValidSubmit, onInvalidSubmit } = useSubmitApplication(applicationId)

  const isBankruptcy = fields.recallType === 'bankruptcy'

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onValidSubmit, onInvalidSubmit)}>
        <ApplicationShell sidebar={<Text variant="h4">Texti hér</Text>}>
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
            <RecallSettlementFields />
            <RecallLiquidatorFields />
            <PublishingFields additionalTitle="innköllunar" />
            <RecallDivisionFields required={isBankruptcy} />
            <SignatureFields />
            <CommunicationChannelFields />
          </Stack>
        </ApplicationShell>
      </form>
    </FormProvider>
  )
}
