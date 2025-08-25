'use client'
import { useRouter } from 'next/navigation'

import { FormProvider, useForm } from 'react-hook-form'

import { Stack, Text, toast } from '@island.is/island-ui/core'

import { useSubmitApplication } from '../../../../hooks/useSubmitApplication'
import { recallForm } from '../../../../lib/forms/recall-form'
import { BankruptcyFormSchema } from '../../../../lib/forms/schemas/recall-schema'
import { ApplicationShell } from '../../application/ApplicationShell'
import { RecallAdvertFields } from './fields/RecallAdvertFields'
import { RecallDivisionFields } from './fields/RecallDivisionFields'
import { RecallLiquidatorFields } from './fields/RecallLiquidatorFields'
import { RecallPublishingFields } from './fields/RecallPublishingFields'
import { RecallSignatureFields } from './fields/RecallSignatureFields'

type Props = {
  caseId: string
  applicationId: string
  courtOptions: { label: string; value: string }[]
  fields: {
    advert: Partial<BankruptcyFormSchema['advert']>
    settlement: Partial<BankruptcyFormSchema['settlement']>
    liquidator: Partial<BankruptcyFormSchema['liquidator']>
    publishing: Partial<BankruptcyFormSchema['publishing']>
    divisionMeeting: Partial<BankruptcyFormSchema['divisionMeeting']>
    signature: Partial<BankruptcyFormSchema['signature']>
  }
}

export const RecallForm = ({
  caseId,
  applicationId,
  courtOptions,
  fields,
}: Props) => {
  const router = useRouter()

  const methods = useForm<BankruptcyFormSchema>(
    recallForm({ caseId, applicationId, courtOptions, fields }),
  )

  const { trigger } = useSubmitApplication({
    onSuccess: () => router.refresh(),
  })

  const onValidSubmit = (_data: BankruptcyFormSchema) => {
    trigger({ applicationId })
  }

  const onInvalidSubmit = (_errors: unknown) => {
    toast.error('Umsóknin er ekki gild.', {
      toastId: 'submit-recall-application-error',
    })
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onValidSubmit, onInvalidSubmit)}>
        <ApplicationShell sidebar={<Text variant="h4">Texti hér</Text>}>
          <Stack space={[2, 3, 4]}>
            <Stack space={[1, 2]}>
              <Text variant="h2">Innköllun</Text>
              <Text>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.
              </Text>
            </Stack>
            <RecallAdvertFields />
            {/* <RecallSettlementFields applicationType={application.recallType} /> */}
            <RecallLiquidatorFields />
            <RecallPublishingFields />
            <RecallDivisionFields />
            <RecallSignatureFields />
          </Stack>
        </ApplicationShell>
      </form>
    </FormProvider>
  )
}
