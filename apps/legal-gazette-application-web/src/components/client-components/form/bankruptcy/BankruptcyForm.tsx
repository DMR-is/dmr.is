'use client'
import { useRouter } from 'next/navigation'

import { FormProvider, useForm } from 'react-hook-form'
import useSWRMutation from 'swr/mutation'

import { Stack, Text, toast } from '@island.is/island-ui/core'

import {
  BankruptcyApplicationDto,
  SubmitBankruptcyApplicationRequest,
} from '../../../../gen/fetch'
import { submitBankruptcyApplication } from '../../../../lib/fetchers'
import { bankruptcyForm } from '../../../../lib/forms/bankruptcy-form'
import { BankruptcyFormSchema } from '../../../../lib/forms/schemas/bankruptcy-schema'
import { ApplicationShell } from '../../application/ApplicationShell'
import { ApplicationFooter } from '../../application/footer/ApplicationFooter'
import { BankruptcyAdvertFields } from './fields/BankruptcyAdvertFields'
import { BankruptcyDivisionFields } from './fields/BankruptcyDivisionFields'
import { BankruptcyLiquidatorFields } from './fields/BankruptcyLiquidatorFields'
import { BankruptcyPublishingFields } from './fields/BankruptcyPublishingFields'
import { BankruptcySettlementFields } from './fields/BankruptcySettlementFields'
import { BankruptcySignatureFields } from './fields/BankruptcySignatureFields'

type Props = {
  caseId: string
  applicationId: string
  application: BankruptcyApplicationDto
  courtOptions: { label: string; value: string }[]
}

export const BankruptcyForm = ({
  caseId,
  applicationId,
  application,
  courtOptions,
}: Props) => {
  const router = useRouter()

  const methods = useForm<BankruptcyFormSchema>(
    bankruptcyForm({ caseId, applicationId, application, courtOptions }),
  )

  const { trigger: submitBankruptcyApplicationTrigger } = useSWRMutation(
    'submitBankruptcyApplication',
    (_key: string, { arg }: { arg: SubmitBankruptcyApplicationRequest }) =>
      submitBankruptcyApplication(arg),
    {
      onSuccess: () => {
        toast.success('Umsókn hefur verið send til birtingar.', {
          toastId: 'submit-bankruptcy-application-success',
        })

        router.refresh()
      },
      onError: () => {
        toast.error(
          'Ekki tókst að senda inn umsókn. Vinsamlegast reyndu aftur síðar.',
          {
            toastId: 'submit-bankruptcy-application-error',
          },
        )
      },
    },
  )

  const onValidSubmit = (_data: BankruptcyFormSchema) => {
    submitBankruptcyApplicationTrigger({ applicationId, caseId })
  }

  const onInvalidSubmit = (_errors: unknown) => {
    toast.error('Umsóknin er ekki gild.', {
      toastId: 'submit-bankruptcy-application-error',
    })
  }

  return (
    <FormProvider {...methods}>
      <form
        id="bankruptcy"
        onSubmit={methods.handleSubmit(onValidSubmit, onInvalidSubmit)}
      >
        <ApplicationShell sidebar={<Text variant="h4">Texti hér</Text>}>
          <Stack space={[2, 3, 4]}>
            <Stack space={[1, 2]}>
              <Text variant="h2">Innköllun þrotabús</Text>
              <Text>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.
              </Text>
            </Stack>
            <BankruptcyAdvertFields />
            <BankruptcySettlementFields />
            <BankruptcyLiquidatorFields />
            <BankruptcyPublishingFields />
            <BankruptcyDivisionFields />
            <BankruptcySignatureFields />
          </Stack>
        </ApplicationShell>
      </form>
    </FormProvider>
  )
}
