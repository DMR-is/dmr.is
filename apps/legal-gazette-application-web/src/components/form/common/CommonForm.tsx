'use client'

import { FormProvider, useForm } from 'react-hook-form'

import { CommonApplicationSchema } from '@dmr.is/legal-gazette/schemas'
import {
  Button,
  Inline,
  LinkV2,
  SkeletonLoader,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { useSubmitApplication } from '../../../hooks/useSubmitApplication'
import { PageRoutes } from '../../../lib/constants'
import { commonForm, CommonFormProps } from '../../../lib/forms/common-form'
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
              <Inline justifyContent="spaceBetween" alignY="top">
                <Text variant="h2">Almenn umsókn</Text>
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
