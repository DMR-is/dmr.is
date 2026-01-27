import * as z from 'zod'

import {
  ApplicationTypeEnum,
  baseApplicationSchemaRefined,
  courtAndJudgmentSchemaRefined,
  publishingDatesRecallSchemaRefined,
  recallBankruptcySchemaRefined,
  recallDeceasedSchemaRefined,
} from '@dmr.is/legal-gazette/schemas'
import { Text } from '@dmr.is/ui/components/island-is'

import { CommunicationChannelFields } from '../../../components/form/fields/CommunicationChannelFields'
import { PublishingFields } from '../../../components/form/fields/PublishingFields'
import { SignatureFields } from '../../../components/form/fields/SignatureFields'
import { RecallAdvertFields } from '../../../components/form/recall/fields/RecallAdvertFields'
import { RecallDivisionFields } from '../../../components/form/recall/fields/RecallDivisionFields'
import { RecallLiquidatorFields } from '../../../components/form/recall/fields/RecallLiquidatorFields'
import { RecallRequirementStatementFields } from '../../../components/form/recall/fields/RecallRequirementStatementFields'
import { RecallSettlementFields } from '../../../components/form/recall/fields/settlement/RecallSettlementFields'
import { PrerequisitesSteps } from '../../../components/form/steps/PrequesitesSteps'
import { PreviewStep } from '../../../components/form/steps/PreviewStep'
import { SummaryStep } from '../../../components/form/steps/SummaryStep'
import { LegalGazetteForm } from '../types'

export const RecallFormSteps = (
  type:
    | ApplicationTypeEnum.RECALL_BANKRUPTCY
    | ApplicationTypeEnum.RECALL_DECEASED,
): LegalGazetteForm => {
  const isBankruptcy = type === ApplicationTypeEnum.RECALL_BANKRUPTCY
  const allSteps: LegalGazetteForm = {
    steps: [
      {
        title: 'Skilyrði fyrir birtingu',
        stepTitle: 'Skilyrði',
        validationSchema: baseApplicationSchemaRefined.pick({
          prequisitesAccepted: true,
        }),
        fields: [
          {
            content: <PrerequisitesSteps />,
          },
        ],
      },
      {
        title: 'Grunnupplýsingar',
        stepTitle: 'Grunnupplýsingar',
        validationSchema: baseApplicationSchemaRefined
          .pick({
            additionalText: true,
            signature: true,
          })
          .extend({
            fields: z.object({
              courtAndJudgmentFields: courtAndJudgmentSchemaRefined,
            }),
          }),
        fields: [
          {
            content: <RecallAdvertFields />,
          },
          {
            title: 'Undirritun',
            content: <SignatureFields />,
            space: [0],
          },
        ],
      },
      {
        title: `Upplýsingar um ${isBankruptcy ? 'þrotabúið' : 'dánarbúið'}`,
        stepTitle: isBankruptcy ? 'Þrotabú' : 'Dánarbú',
        validationSchema: isBankruptcy
          ? z.object({
              fields: recallBankruptcySchemaRefined.pick({
                settlementFields: true,
              }),
            })
          : z.object({
              fields: recallDeceasedSchemaRefined.pick({
                settlementFields: true,
              }),
            }),
        fields: [
          {
            intro: (
              <Text>
                {`${`Sláðu inn kennitölu hér fyrir neðan og við munum sækja upplýsingar um `}${isBankruptcy ? 'þrotabúið' : 'dánarbúið'}.`}
              </Text>
            ),
            content: <RecallSettlementFields />,
          },
          {
            title: 'Upplýsingar um skiptastjóra',
            content: <RecallLiquidatorFields />,
          },
          {
            title: 'Kröfulýsingar',
            content: <RecallRequirementStatementFields />,
          },
        ],
      },
      {
        title: 'Óskir um birtingu',
        stepTitle: 'Birting',
        validationSchema: baseApplicationSchemaRefined
          .pick({
            communicationChannels: true,
          })
          .extend({
            publishingDates: publishingDatesRecallSchemaRefined,
          }),
        fields: [
          {
            title: 'Birtingardagar',
            intro: (
              <Text>
                Að minnsta kosti tveir birtingardagar eru nauðsynlegir og mest
                þrír.
              </Text>
            ),
            content: <PublishingFields applicationType="RECALL" />,
          },
          {
            title: 'Samskiptaleiðir',
            intro: (
              <Text>
                Hér getur þú skráð inn tölvupóstfang og símanúmer þess sem best
                er að hafa samskipti við vegna auglýsingarinnar, hægt er að skrá
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

  if (isBankruptcy) {
    // Add Skiptafundur step for bankruptcy recalls
    const divisionStep: LegalGazetteForm['steps'][number] = {
      title: 'Skiptafundur',
      stepTitle: 'Skiptafundur',
      validationSchema: z.object({
        fields: recallBankruptcySchemaRefined.pick({
          divisionMeetingFields: true,
        }),
      }),
      fields: [
        {
          intro: (
            <Text>Bættu við hvar og hvenær fyrsti skiptafundur fer fram.</Text>
          ),
          content: <RecallDivisionFields isBankruptcy={isBankruptcy} />,
        },
      ],
    }
    allSteps.steps.splice(4, 0, divisionStep)
  }

  return allSteps
}
