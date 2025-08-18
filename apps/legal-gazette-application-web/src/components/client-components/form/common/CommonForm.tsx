'use client'

import { FormProvider, useForm } from 'react-hook-form'

import { Stack, Text } from '@island.is/island-ui/core'

import { CommonApplicationDto } from '../../../../gen/fetch'
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
  const methods = useForm<CommonFormSchema>(
    commonForm({
      applicationId: applicationId,
      caseId: caseId,
      categoryOptions: categories,
      application: application,
    }),
  )

  const onValidSubmit = (data: CommonFormSchema) => {
    console.log('Form submitted successfully:', data)
  }

  const onInvalidSubmit = (errors: unknown) => {
    console.error('Form submission failed:', errors)
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
