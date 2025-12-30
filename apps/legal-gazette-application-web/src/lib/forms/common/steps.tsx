import { AdvertContentField } from '../../../components/form/common/fields/AdvertContentFields'
import { CommonAdvertFields } from '../../../components/form/common/fields/CommonAdvertFields'
import { PublishingFields } from '../../../components/form/common/fields/PublishingFields'
import { CommunicationChannelFields } from '../../../components/form/fields/CommunicationChannelFields'
import { SignatureFields } from '../../../components/form/fields/SignatureFields'
import { PrerequisitesSteps } from '../../../components/form/steps/PrequesitesSteps'
import { PreviewStep } from '../../../components/form/steps/PreviewStep'
import { SummaryStep } from '../../../components/form/steps/SummaryStep'
import { LegalGazetteForm } from '../types'

export const CommonForm: LegalGazetteForm = {
  steps: [
    {
      title: 'Skilyrði fyrir birtingu',
      stepTitle: 'Skilyrði',
      fields: [
        {
          title: 'Skilyrði fyrir birtingu',
          content: <PrerequisitesSteps />,
        },
      ],
    },
    {
      title: 'Grunnupplýsingar',
      stepTitle: 'Upplýsingar',
      fields: [
        {
          title: 'Tegund og flokkur auglýsingar',
          content: <CommonAdvertFields />,
        },
        {
          title: 'Meginmál auglýsingar',
          content: <AdvertContentField />,
        },
        {
          title: 'Undirritun',
          content: <SignatureFields />,
        },
      ],
    },
    {
      title: 'Birtingardagar',
      stepTitle: 'Birting',
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
