import {
  baseApplicationSchemaRefined,
  commonApplicationAnswersRefined,
} from '@dmr.is/legal-gazette-schemas'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { AdvertContentField } from '../../../components/form/common/fields/AdvertContentFields'
import { CommonAdvertFields } from '../../../components/form/common/fields/CommonAdvertFields'
import { CommunicationChannelFields } from '../../../components/form/fields/CommunicationChannelFields'
import { PublishingFields } from '../../../components/form/fields/PublishingFields'
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
      stepTitle: 'Grunnupplýsingar',
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
          intro: (
            <Text>
              Að minnsta kosti einn birtingardagur er nauðsynlegur og mest þrír.
            </Text>
          ),
          content: <PublishingFields applicationType="COMMON" />,
        },
        {
          title: 'Samskiptaleiðir',
          intro: (
            <Text>
              Hér getur þú skráð inn tölvupóstfang og símanúmer þess sem best er
              að hafa samskipti við vegna auglýsingarinnar, hægt er að skrá
              fleirri.
            </Text>
          ),
          content: <CommunicationChannelFields />,
        },
      ],
    },
    {
      title: 'Forskoðun',
      stepTitle: 'Forskoðun',
      fields: [
        {
          content: <PreviewStep />,
        },
      ],
    },
    {
      title: 'Samantekt',
      stepTitle: 'Samantekt',
      fields: [
        {
          content: <SummaryStep />,
        },
      ],
    },
  ],
}
