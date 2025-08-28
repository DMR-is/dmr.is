'use client'

import { useRouter } from 'next/navigation'

import { FormProvider, useForm } from 'react-hook-form'
import useSWRMutation from 'swr/mutation'

import { Stack, Text, toast } from '@island.is/island-ui/core'

import { CommonApplicationDto } from '../../../../gen/fetch'
import { submitCommonApplication } from '../../../../lib/fetchers'
import { commonForm } from '../../../../lib/forms/common-form'
import { CommonFormSchema } from '../../../../lib/forms/schemas/common-schema'
import { ApplicationShell } from '../../application/ApplicationShell'
import { CommonAdvertFields } from './fields/CommonAdvertFields'
import { CommonPublishingFields } from './fields/CommonPublishingFields'
import { CommonSignatureFields } from './fields/CommonSignatureFields'

type Props = {
  applicationId: string
  caseId: string
  categories: { label: string; value: string }[]
  application: CommonApplicationDto
}

export const CommonForm = ({
  applicationId,
  caseId,
  categories,
  application,
}: Props) => {
  const router = useRouter()
  const methods = useForm<CommonFormSchema>(
    commonForm({
      applicationId: applicationId,
      caseId: caseId,
      categoryOptions: categories,
      application: application,
    }),
  )

  const { trigger } = useSWRMutation(
    'submitCommonApplication',
    () =>
      submitCommonApplication({
        applicationId: applicationId,
        caseId: caseId,
      }),
    {
      onSuccess: () => {
        toast.success('Umsókn hefur verið send', {
          toastId: 'submit-common-application-success',
        })

        router.refresh()
      },
      onError: (_error) => {
        toast.error('Villa kom upp við að senda umsókn', {
          toastId: 'submit-common-application-error',
        })
      },
    },
  )

  const onValidSubmit = (_data: CommonFormSchema) => {
    trigger()
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
            <CommonPublishingFields />
          </Stack>
        </ApplicationShell>
      </form>
    </FormProvider>
  )
}
