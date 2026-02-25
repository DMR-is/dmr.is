import get from 'lodash/get'

import {
  ApplicationRequirementStatementEnum,
  ApplicationTypeEnum,
  commonApplicationAnswers,
  recallBankruptcyAnswers,
  recallDeceasedAnswers,
} from '@dmr.is/legal-gazette/schemas'

import { LegalGazetteHTMLTemplates } from '../constants'
import { getAdvertHTMLMarkup } from '../templates/base'

const mapApplicationTypeToTemplate = (applicationType: string) => {
  switch (applicationType) {
    case ApplicationTypeEnum.COMMON:
      return LegalGazetteHTMLTemplates.COMMON
    case ApplicationTypeEnum.RECALL_BANKRUPTCY:
      return LegalGazetteHTMLTemplates.RECALL_BANKRUPTCY
    case ApplicationTypeEnum.RECALL_DECEASED:
      return LegalGazetteHTMLTemplates.RECALL_DECEASED
    default:
      return LegalGazetteHTMLTemplates.COMMON
  }
}
// "custom" | "location" | "email"'.
const mapStatementType = (statementType: string | null | undefined = '') => {
  switch (statementType) {
    case ApplicationRequirementStatementEnum.CUSTOMLIQUIDATOREMAIL:
      return 'email'
    case ApplicationRequirementStatementEnum.CUSTOMLIQUIDATORLOCATION:
      return 'custom'
    case ApplicationRequirementStatementEnum.LIQUIDATORLOCATION:
      return 'location'
    default:
      return 'location'
  }
}

type ApplicationPreview =
  | {
      html: string
      error: null
    }
  | {
      html: null
      error: string
    }

export const getApplicationPreview = (
  type: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  application: Record<string, any>,
): ApplicationPreview => {

  const mappedType = mapApplicationTypeToTemplate(type)

  switch (mappedType) {
    case LegalGazetteHTMLTemplates.COMMON: {
      const parsed = commonApplicationAnswers.safeParse(application)

      if (!parsed.success) {
        return {
          html: null,
          error: 'Failed to parse application answers',
        }
      }

      const answers = parsed.data
      const firstPub = get(application, 'publishingDates.0')

      const html = getAdvertHTMLMarkup({
        templateType: LegalGazetteHTMLTemplates.COMMON,
        additionalText: application.additionalText,
        content: answers.fields?.html ?? '',
        publishDate: firstPub ? new Date(firstPub) : undefined,
        signature: application.signature,
        title: `${answers.fields?.type?.title}${answers.fields?.caption ? ` - ${answers.fields.caption}` : ''}`,
      })

      return { html, error: null }
    }
    case LegalGazetteHTMLTemplates.RECALL_BANKRUPTCY: {
      const parsed = recallBankruptcyAnswers.safeParse(application)

      if (!parsed.success) {
        return {
          html: null,
          error: 'Failed to parse application answers',
        }
      }

      const answers = parsed.data

      const judgementDate = answers.fields?.courtAndJudgmentFields?.judgmentDate
        ? new Date(answers.fields.courtAndJudgmentFields.judgmentDate)
        : undefined

      const pubDate = get(application, 'publishingDates.0')
      const publishDate = pubDate ? new Date(pubDate) : undefined
      const deadlineDate = answers.fields?.settlementFields?.deadlineDate
        ? new Date(answers.fields.settlementFields.deadlineDate)
        : undefined
      const meetingDate = answers.fields?.divisionMeetingFields?.meetingDate
        ? new Date(answers.fields.divisionMeetingFields.meetingDate)
        : undefined

      const html = getAdvertHTMLMarkup({
        templateType: LegalGazetteHTMLTemplates.RECALL_BANKRUPTCY,
        additionalText: application.additionalText,
        courtDistrict:
          answers.fields?.courtAndJudgmentFields?.courtDistrict?.title,
        judgementDate: judgementDate,
        publishDate: publishDate,
        signature: application.signature,
        settlement: {
          statementType: mapStatementType(
            answers.fields?.settlementFields?.recallRequirementStatementType,
          ),
          customLiquidatorLocation:
            answers.fields?.settlementFields
              ?.recallRequirementStatementLocation ?? '',
          address: answers.fields?.settlementFields?.address ?? '',
          deadlineDate: deadlineDate,
          liquidatorLocation:
            answers.fields?.settlementFields?.liquidatorLocation ?? '',
          liquidatorName:
            answers.fields?.settlementFields?.liquidatorName ?? '',
          meetingDate: meetingDate,
          meetingLocation:
            answers.fields?.divisionMeetingFields?.meetingLocation ?? '',
          name: answers.fields?.settlementFields?.name ?? '',
          nationalId: answers.fields?.settlementFields?.nationalId ?? '',
        },
        title: `Innköllun þrotabús - ${answers.fields?.settlementFields?.name ?? ''}`,
      })

      return { html, error: null }
    }
    case LegalGazetteHTMLTemplates.RECALL_DECEASED: {
      const parsed = recallDeceasedAnswers.safeParse(application)

      if (!parsed.success) {
        return {
          html: null,
          error: 'Failed to parse application answers',
        }
      }

      const answers = parsed.data

      const pubDate = get(application, 'publishingDates.0')
      const publishDate = pubDate ? new Date(pubDate) : undefined
      const dateOfDeath = answers.fields?.settlementFields?.dateOfDeath
        ? new Date(answers.fields.settlementFields.dateOfDeath)
        : undefined

      const html = getAdvertHTMLMarkup({
        templateType: LegalGazetteHTMLTemplates.RECALL_DECEASED,
        additionalText: application.additionalText,
        publishDate: publishDate,
        signature: application.signature,
        title: `Innköllun dánarbús - ${answers.fields?.settlementFields?.name ?? ''}`,
        settlement: {
          statementType: mapStatementType(
            answers.fields?.settlementFields?.recallRequirementStatementType,
          ),
          customLiquidatorLocation:
            answers.fields?.settlementFields
              ?.recallRequirementStatementLocation ?? '',
          address: answers.fields?.settlementFields?.address ?? '',
          dateOfDeath: dateOfDeath,
          liquidatorLocation:
            answers.fields?.settlementFields?.liquidatorLocation ?? '',
          liquidatorName:
            answers.fields?.settlementFields?.liquidatorName ?? '',
          name: answers.fields?.settlementFields?.name ?? '',
          nationalId: answers.fields?.settlementFields?.nationalId ?? '',
          companies: answers.fields?.settlementFields?.companies ?? [],
        },
      })

      return { html, error: null }
    }
  }

  return {
    html: null,
    error: 'Unsupported application type',
  }
}
