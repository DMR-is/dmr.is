'use client'

import { FormProvider, useForm } from 'react-hook-form'

import { CommonApplicationSchema } from '@dmr.is/legal-gazette/schemas'

import { SkeletonLoader, Stack, Text } from '@island.is/island-ui/core'

import { useSubmitApplication } from '../../../../hooks/useSubmitApplication'
import { commonForm, CommonFormProps } from '../../../../lib/forms/common-form'
import { ApplicationShell } from '../../application/ApplicationShell'
import { CommunicationChannelFields } from '../fields/CommunicationChannelFields'
import { PublishingFields } from '../fields/PublishingFields'
import { SignatureFields } from '../fields/SignatureFields'
import { CommonAdvertFields } from './fields/CommonAdvertFields'

export const CommonForm = (props: CommonFormProps) => {
  const methods = useForm<CommonApplicationSchema>(commonForm(props))

  const { onValidSubmit, onInvalidSubmit } = useSubmitApplication(
    props.metadata.applicationId,
  )

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
            {methods.formState.isReady === false ? (
              <SkeletonLoader
                space={[2, 3]}
                repeat={3}
                height={66}
                borderRadius="large"
              />
            ) : (
              <>
                <CommonAdvertFields />
                <SignatureFields />
                <PublishingFields />
                <CommunicationChannelFields />
              </>
            )}
          </Stack>
        </ApplicationShell>
      </form>
    </FormProvider>
  )
}
