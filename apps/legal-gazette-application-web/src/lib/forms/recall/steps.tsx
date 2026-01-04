import z from 'zod'

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
  return {
    steps: [
      {
        title: 'Skilyrði fyrir birtingu',
        stepTitle: 'Skilyrði',
        validationSchema: baseApplicationSchemaRefined.pick({
          prequisitesAccepted: true,
        }),
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
            title: 'Dómstóll og úrskurðardagur',
            intro: <Text>Dómstóll og úrskurðardagur eru nauðsynlegir</Text>,
            content: <RecallAdvertFields />,
          },
          {
            title: 'Undirritun',
            intro: (
              <Text>
                Fylla þarf út eitt af eftirfarandi: nafn, staðsetningu eða
                dagsetningu undirritunar
              </Text>
            ),
            content: <SignatureFields />,
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
            title: isBankruptcy ? 'Nánar um þrotabúið' : 'Nánar um dánarbúið',
            intro: (
              <Text>
                {`${`Sláðu inn kennitölu hér fyrir neðan og við munum sækja upplýsingar um `}${isBankruptcy ? 'þrotabúið' : 'dánarbúið'}`}
              </Text>
            ),
            content: <RecallSettlementFields />,
          },
          {
            title: 'Upplýsingar um skiptastjóra',
            // intro: <Text>Fylla þarf út nafn og staðsetningu skiptastjóra</Text>,
            content: <RecallLiquidatorFields />,
          },
          {
            title: 'Kröfulýsingar',
            intro: (
              <Text>
                Kröfulýsingar sem berast skiptastjóri á eftirfarandi máta
              </Text>
            ),
            content: <RecallRequirementStatementFields />,
          },
        ],
      },
      {
        title: 'Birtingardagar',
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
            title: 'Birting',
            intro: (
              <Text>
                Veldu dagsetningar hér fyrir neðan um ósk um birtingardag. Að
                minnsta kosti einn birtingardagur er nauðsynlegur og mest þrír.
              </Text>
            ),
            content: (
              <PublishingFields
                additionalTitle="innköllunar"
                applicationType="RECALL"
              />
            ),
          },
          {
            title: 'Samskiptaleiðir',
            intro: (
              <Text>
                Bættu við upplýsingum um tengiliða, tengiliðir í
                samskiptaleiðium fá tilkynningar varðandi útgáfu á
                auglýsingunni.
              </Text>
            ),
            content: <CommunicationChannelFields />,
          },
        ],
      },
      {
        title: 'Skiptafundur',
        stepTitle: 'Skiptafundur',
        validationSchema: isBankruptcy
          ? z.object({
              fields: recallBankruptcySchemaRefined.pick({
                divisionMeetingFields: true,
              }),
            })
          : z.object({
              fields: recallDeceasedSchemaRefined.pick({
                divisionMeetingFields: true,
              }),
            }),
        fields: [
          {
            title: 'Skiptafundur',
            intro: isBankruptcy ? (
              <Text>Hvar og hvenær fyrsti skiptafundur fer fram</Text>
            ) : (
              <Text>
                Fylltu út reitina hér fyrir neðan ef þú vilt auglýsa skiptafund
                með innköllunni
              </Text>
            ),
            content: <RecallDivisionFields isBankruptcy={isBankruptcy} />,
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
}
