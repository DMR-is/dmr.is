'use client'

import { FormProvider, useForm } from 'react-hook-form'

import { RecallApplicationSchema } from '@dmr.is/legal-gazette/schemas'
import {
  AlertMessage,
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
import { RecallSettlementFields } from './fields/RecallSettlementFields'

export const RecallForm = (props: RecallFormProps) => {
  const methods = useForm<RecallApplicationSchema>(recallForm(props))

  const { onValidSubmit, onInvalidSubmit } = useSubmitApplication(
    props.metadata.applicationId,
  )

  const isBankruptcy = props.fields.type === 'RECALL_BANKRUPTCY'

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onValidSubmit, onInvalidSubmit)}>
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
              alert={
                <AlertMessage
                  type="info"
                  title="Minnst tveir birtingardagar eru nauðsynlegir"
                  message="Bættu við birtingardögum fyrir innköllunina hér fyrir neðan."
                />
              }
            />
            <RecallDivisionFields required={isBankruptcy} />
            <SignatureFields />
            <CommunicationChannelFields />
          </Stack>
        </ApplicationShell>
      </form>
    </FormProvider>
  )
}
