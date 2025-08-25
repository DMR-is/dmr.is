'use client'

import { useRouter } from 'next/navigation'

import { FormProvider, useForm } from 'react-hook-form'

import { Stack, Text, toast } from '@island.is/island-ui/core'

import { useSubmitApplication } from '../../../../hooks/useSubmitApplication'
import { commonForm } from '../../../../lib/forms/common-form'
import { CommonFormSchema } from '../../../../lib/forms/schemas/common-schema'
import { ApplicationShell } from '../../application/ApplicationShell'
import { CommunicationChannelFields } from '../fields/CommunicationChannelFields'
import { PublishingFields } from '../fields/PublishingFields'
import { CommonAdvertFields } from './fields/CommonAdvertFields'
import { CommonSignatureFields } from './fields/CommonSignatureFields'

type Props = {
  applicationId: string
  caseId: string
  categories: { label: string; value: string }[]
  fields: Partial<CommonFormSchema['fields']>
}

export const CommonForm = ({
  applicationId,
  caseId,
  categories,
  fields,
}: Props) => {
  const router = useRouter()
  const methods = useForm<CommonFormSchema>(
    commonForm({
      applicationId: applicationId,
      caseId: caseId,
      categoryOptions: categories,
      fields: fields,
    }),
  )

  const { trigger } = useSubmitApplication({
    onSuccess: () => router.refresh(),
  })

  const onValidSubmit = (_data: CommonFormSchema) => {
    trigger({ applicationId: applicationId })
  }

  const onInvalidSubmit = (_errors: unknown) => {
    toast.error('Umsókn er ekki rétt útfyllt', {
      toastId: 'submit-common-application-error',
    })
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onValidSubmit, onInvalidSubmit)}>
        <ApplicationShell>
          <Stack space={[2, 3, 4]}>
            <Stack space={[1, 2]}>
              <Text variant="h2">Almenn umsókn</Text>
              <Text>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.
              </Text>
            </Stack>
            <CommonAdvertFields />
            <CommonSignatureFields />
            <PublishingFields />
            <CommunicationChannelFields />
          </Stack>
        </ApplicationShell>
      </form>
    </FormProvider>
  )
}
