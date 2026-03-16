import { InternalServerErrorException } from '@nestjs/common'

import {
  getAdvertHTMLMarkup,
  LegalGazetteHTMLTemplates,
} from '@dmr.is/legal-gazette-html'
import {
  ApplicationRequirementStatementEnum,
  SettlementType,
} from '@dmr.is/legal-gazette-schemas'

import type { AdvertModel } from './advert.model'
import { AdvertTemplateType } from './advert.model'
import { AdvertVersionEnum } from './advert-publication.model'

type HTMLVersion = 'A' | 'B' | 'C'

const DEFAULT_VERSION = AdvertVersionEnum.A

const mapVersion = (
  version: AdvertVersionEnum | undefined = DEFAULT_VERSION,
): HTMLVersion => version as HTMLVersion

const mapStatementType = (
  statementType?: string | null,
): 'location' | 'custom' | 'email' => {
  switch (statementType) {
    case ApplicationRequirementStatementEnum.CUSTOMLIQUIDATOREMAIL:
      return 'email'
    case ApplicationRequirementStatementEnum.CUSTOMLIQUIDATORLOCATION:
      return 'custom'
    default:
      return 'location'
  }
}

const mapSettlementType = (
  settlementType?: string | null,
): 'default' | 'undivided' | 'owner' => {
  switch (settlementType) {
    case SettlementType.UNDIVIDED:
      return 'undivided'
    case SettlementType.OWNER:
      return 'owner'
    default:
      return 'default'
  }
}

const mapTemplateType = ({
  settlementDateOfDeath,
  templateType,
}: {
  settlementDateOfDeath?: Date | string | null
  templateType: AdvertTemplateType
}): LegalGazetteHTMLTemplates => {
  switch (templateType) {
    case AdvertTemplateType.RECALL_BANKRUPTCY:
      return LegalGazetteHTMLTemplates.RECALL_BANKRUPTCY
    case AdvertTemplateType.RECALL_DECEASED:
      return LegalGazetteHTMLTemplates.RECALL_DECEASED
    case AdvertTemplateType.DIVISION_MEETING_BANKRUPTCY:
      return LegalGazetteHTMLTemplates.DIVISION_MEETING_BANKRUPTCY
    case AdvertTemplateType.DIVISION_MEETING_DECEASED:
      return LegalGazetteHTMLTemplates.DIVISION_MEETING_DECEASED
    case AdvertTemplateType.DIVISION_ENDING:
      return settlementDateOfDeath
        ? LegalGazetteHTMLTemplates.DIVISION_ENDING_DECEASED
        : LegalGazetteHTMLTemplates.DIVISION_ENDING_BANKRUPTCY
    case AdvertTemplateType.FORECLOSURE:
      return LegalGazetteHTMLTemplates.FORECLOSURE
    case AdvertTemplateType.ADDITIONAL_ANNOUNCEMENT:
    case AdvertTemplateType.COMMON:
    default:
      return LegalGazetteHTMLTemplates.COMMON
  }
}

const getPublicationData = (
  publications: Array<{
    versionLetter: AdvertVersionEnum
    publishedAt?: Date | string | null
    scheduledAt: Date | string
  }>,
  version: AdvertVersionEnum | undefined = DEFAULT_VERSION,
  errorMessage: string,
) => {
  const resolvedVersion = version ?? DEFAULT_VERSION
  const publication = publications.find(
    (pub) => pub.versionLetter === resolvedVersion,
  )
  const rawPublishDate = publication?.publishedAt ?? publication?.scheduledAt

  if (!rawPublishDate) {
    throw new InternalServerErrorException(errorMessage)
  }

  return {
    isPublished: Boolean(publication?.publishedAt),
    publishDate:
      rawPublishDate instanceof Date
        ? rawPublishDate
        : new Date(rawPublishDate),
    version: mapVersion(resolvedVersion),
  }
}

const buildBaseProps = ({
  additionalText,
  publicationNumber,
  publishDate,
  signature,
  title,
  version,
  isPublished,
}: {
  additionalText?: string | null
  publicationNumber?: string | null
  publishDate: Date
  signature?: {
    date?: Date | string | null
    location?: string | null
    name?: string | null
    onBehalfOf?: string | null
  } | null
  title: string
  version: HTMLVersion
  isPublished: boolean
}) => ({
  additionalText: additionalText ?? undefined,
  isPublished,
  publicationNumber: publicationNumber
    ? `${publicationNumber}${version}`
    : undefined,
  publishDate,
  signature: signature
    ? {
        date: signature.date,
        location: signature.location,
        name: signature.name,
        onBehalfOf: signature.onBehalfOf,
      }
    : undefined,
  title,
  version,
})

export function getAdvertHtmlMarkup(
  model: AdvertModel,
  version: AdvertVersionEnum | undefined = DEFAULT_VERSION,
): string {
  const publication = getPublicationData(
    model.publications,
    version,
    'Publication date not found for advert',
  )
  const templateType = mapTemplateType({
    settlementDateOfDeath: model.settlement?.dateOfDeath,
    templateType: model.templateType,
  })
  const baseProps = buildBaseProps({
    additionalText: model.additionalText,
    publicationNumber: model.publicationNumber,
    publishDate: publication.publishDate,
    signature: model.signature,
    title: model.title,
    version: publication.version,
    isPublished: publication.isPublished,
  })

  switch (templateType) {
    case LegalGazetteHTMLTemplates.RECALL_BANKRUPTCY:
      return getAdvertHTMLMarkup({
        ...baseProps,
        courtDistrict: model.courtDistrict?.title ?? '',
        judgementDate: model.judgementDate ?? undefined,
        settlement: {
          address: model.settlement?.address ?? '',
          customLiquidatorLocation:
            model.settlement?.liquidatorRecallStatementLocation ?? '',
          deadlineDate: model.settlement?.deadline ?? undefined,
          liquidatorLocation: model.settlement?.liquidatorLocation ?? '',
          liquidatorName: model.settlement?.liquidatorName ?? '',
          meetingDate: model.divisionMeetingDate ?? undefined,
          meetingLocation: model.divisionMeetingLocation ?? '',
          name: model.settlement?.name ?? '',
          nationalId: model.settlement?.nationalId ?? '',
          statementType: mapStatementType(
            model.settlement?.liquidatorRecallStatementType,
          ),
        },
        templateType,
      })
    case LegalGazetteHTMLTemplates.RECALL_DECEASED:
      return getAdvertHTMLMarkup({
        ...baseProps,
        courtDistrict: model.courtDistrict?.title ?? '',
        judgementDate: model.judgementDate ?? undefined,
        settlement: {
          address: model.settlement?.address ?? '',
          companies: model.settlement?.companies ?? [],
          customLiquidatorLocation:
            model.settlement?.liquidatorRecallStatementLocation ?? '',
          dateOfDeath: model.settlement?.dateOfDeath ?? undefined,
          liquidatorLocation: model.settlement?.liquidatorLocation ?? '',
          liquidatorName: model.settlement?.liquidatorName ?? '',
          name: model.settlement?.name ?? '',
          nationalId: model.settlement?.nationalId ?? '',
          statementType: mapStatementType(
            model.settlement?.liquidatorRecallStatementType,
          ),
          type: mapSettlementType(model.settlement?.type),
        },
        templateType,
      })
    case LegalGazetteHTMLTemplates.FORECLOSURE:
      return getAdvertHTMLMarkup({
        ...baseProps,
        foreclosure: {
          foreclosureAddress: model.foreclosure?.foreclosureAddress ?? '',
          foreclosureDate: model.foreclosure?.foreclosureDate ?? undefined,
          properties:
            model.foreclosure?.properties.map((property) => ({
              claimant: property.claimant,
              name: property.propertyName,
              number: property.propertyNumber,
              respondent: property.respondent,
              totalPrice: property.propertyTotalPrice,
            })) ?? [],
        },
        templateType,
      })
    case LegalGazetteHTMLTemplates.DIVISION_MEETING_BANKRUPTCY:
      return getAdvertHTMLMarkup({
        ...baseProps,
        address: model.settlement?.address ?? '',
        content: model.content ?? '',
        meetingDate: model.divisionMeetingDate?.toISOString() ?? '',
        meetingLocation: model.divisionMeetingLocation ?? '',
        name: model.settlement?.name ?? '',
        nationalId: model.settlement?.nationalId ?? '',
        templateType,
      })
    case LegalGazetteHTMLTemplates.DIVISION_MEETING_DECEASED:
      return getAdvertHTMLMarkup({
        ...baseProps,
        content: model.content ?? '',
        meetingDate: model.divisionMeetingDate?.toISOString() ?? '',
        meetingLocation: model.divisionMeetingLocation ?? '',
        name: model.settlement?.name ?? '',
        nationalId: model.settlement?.nationalId ?? '',
        templateType,
      })
    case LegalGazetteHTMLTemplates.DIVISION_ENDING_BANKRUPTCY:
    case LegalGazetteHTMLTemplates.DIVISION_ENDING_DECEASED:
      return getAdvertHTMLMarkup({
        ...baseProps,
        content: model.content ?? '',
        courtDistrict: model.courtDistrict?.title ?? '',
        endingDate: model.settlement?.endingDate ?? undefined,
        judgementDate: model.judgementDate?.toISOString() ?? '',
        settlementDeclaredClaims: model.settlement?.declaredClaims ?? undefined,
        settlementName: model.settlement?.name ?? '',
        settlementNationalId: model.settlement?.nationalId ?? '',
        templateType,
      })
    case LegalGazetteHTMLTemplates.COMMON:
    default: {
      console.log({
        ...baseProps,
        content: model.content ?? '',
        templateType: LegalGazetteHTMLTemplates.COMMON,
      })
      return getAdvertHTMLMarkup({
        ...baseProps,
        content: model.content ?? '',
        templateType: LegalGazetteHTMLTemplates.COMMON,
      })
    }
  }
}
