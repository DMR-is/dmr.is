'use client'
import { useRouter } from 'next/navigation'

import { FormProvider, useForm } from 'react-hook-form'

import { Stack, Text, toast } from '@island.is/island-ui/core'

import { RecallApplicationDto, RecallTypeEnum } from '../../../../gen/fetch'
import { useSubmitRecallApplication } from '../../../../hooks/useSubmitRecallApplication'
import { recallForm } from '../../../../lib/forms/recall-form'
import { BankruptcyFormSchema } from '../../../../lib/forms/schemas/recall-schema'
import { ApplicationShell } from '../../application/ApplicationShell'
import { RecallAdvertFields } from './fields/RecallAdvertFields'
import { RecallDivisionFields } from './fields/RecallDivisionFields'
import { RecallLiquidatorFields } from './fields/RecallLiquidatorFields'
import { RecallPublishingFields } from './fields/RecallPublishingFields'
import { RecallSettlementFields } from './fields/RecallSettlementFields'
import { RecallSignatureFields } from './fields/RecallSignatureFields'

type Props = {
  caseId: string
  applicationId: string
  application: RecallApplicationDto
  courtOptions: { label: string; value: string }[]
}

export const RecallForm = ({
  caseId,
  applicationId,
  application,
  courtOptions,
}: Props) => {
  const router = useRouter()

  const methods = useForm<BankruptcyFormSchema>(
    recallForm({ caseId, applicationId, application, courtOptions }),
  )

  const { trigger: submitRecallApplicationTrigger } =
    useSubmitRecallApplication({
      onSuccess: () => router.refresh(),
    })

  const onValidSubmit = (_data: BankruptcyFormSchema) => {
    submitRecallApplicationTrigger({ applicationId, caseId })
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
              <Text variant="h2">{`Innköllun ${application.recallType === RecallTypeEnum.BANKRUPTCY ? 'þrotabús' : 'dánarbús'}`}</Text>
              <Text>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.
              </Text>
            </Stack>
            <RecallAdvertFields />
            <RecallSettlementFields applicationType={application.recallType} />
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
