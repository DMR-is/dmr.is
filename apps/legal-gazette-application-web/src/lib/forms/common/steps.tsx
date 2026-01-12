import {
  baseApplicationSchemaRefined,
  commonApplicationAnswersRefined,
} from '@dmr.is/legal-gazette/schemas'
import { Text } from '@dmr.is/ui/components/island-is'

import { AdvertContentField } from '../../../components/form/common/fields/AdvertContentFields'
import { CommonAdvertFields } from '../../../components/form/common/fields/CommonAdvertFields'
import { PublishingFields } from '../../../components/form/common/fields/PublishingFields'
import { CommunicationChannelFields } from '../../../components/form/fields/CommunicationChannelFields'
import { SignatureFields } from '../../../components/form/fields/SignatureFields'
import { PrerequisitesSteps } from '../../../components/form/steps/PrequesitesSteps'
import { PreviewStep } from '../../../components/form/steps/PreviewStep'
import { SummaryStep } from '../../../components/form/steps/SummaryStep'
import { LegalGazetteForm } from '../types'

export const CommonFormSteps: LegalGazetteForm = {
  steps: [
    {
      title: 'Skilyrði fyrir birtingu',
      stepTitle: 'Skilyrði',
      fields: [
        {
          content: <PrerequisitesSteps />,
        },
      ],
      validationSchema: baseApplicationSchemaRefined.pick({
        prequisitesAccepted: true,
      }),
    },
    {
      title: 'Grunnupplýsingar',
      stepTitle: 'Upplýsingar',
      validationSchema: commonApplicationAnswersRefined.pick({
        signature: true,
        fields: true,
      }),
      fields: [
        {
          content: <CommonAdvertFields />,
        },
        {
          title: (
            <>
              Meginmál auglýsingar{' '}
              <Text fontWeight="regular" color="red600" as="span">
                *
              </Text>
            </>
          ),
          content: <AdvertContentField />,
        },
        {
          title: 'Undirritun',

          content: <SignatureFields />,
          space: [0],
        },
      ],
    },
    {
      title: 'Óskir um birtingu',
      stepTitle: 'Birting',
      validationSchema: commonApplicationAnswersRefined.pick({
        publishingDates: true,
        communicationChannels: true,
      }),
      fields: [
        {
          title: 'Birtingardagar',
          content: <PublishingFields />,
        },
        {
          title: 'Samskiptaleiðir',
          content: <CommunicationChannelFields />,
        },
      ],
    },
    {
      title: 'Forskoðun',
      stepTitle: 'Forskoðun',
      fields: [
        {
          title: 'Forskoðun',
          content: <PreviewStep />,
        },
      ],
    },
    {
      title: 'Samantekt',
      stepTitle: 'Samantekt',
      fields: [
        {
          title: 'Samantekt',
          content: <SummaryStep />,
        },
      ],
    },
  ],
}
