import { AdvertStep } from '../../../components/form/recall/steps/AdvertStep'
import { PublishingStep } from '../../../components/form/recall/steps/PublishingStep'
import { SettlementStep } from '../../../components/form/recall/steps/SettlementStep'
import { PrerequisitesSteps } from '../../../components/form/steps/PrequesitesSteps'
import { PreviewStep } from '../../../components/form/steps/PreviewStep'
import { SummaryStep } from '../../../components/form/steps/SummaryStep'
import { LegalGazetteForm } from '../types'

export const RecallFormSteps: LegalGazetteForm = {
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
          title: 'Grunnupplýsingar',
          content: <AdvertStep />,
        },
      ],
    },
    {
      title: 'Upplýsingar um búið',
      stepTitle: 'Bú',
      fields: [
        {
          title: 'Upplýsingar um búið',
          content: <SettlementStep />,
        },
      ],
    },
    {
      title: 'Birtingardagar',
      stepTitle: 'Birting',
      fields: [
        {
          title: 'Birtingardagar',
          content: <PublishingStep />,
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
