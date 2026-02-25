import { LegalGazetteHTMLTemplates } from '../constants'

export type SignatureMarkupProps = {
  name?: string | null
  onBehalfOf?: string | null
  location?: string | null
  date?: Date | string | null
}

export type BaseTemplateProps = {
  isPublished?: boolean
  publishDate?: Date
  publicationNumber?: string
  version?: 'A' | 'B' | 'C'
  additionalText?: string
  title?: string
  signature?: SignatureMarkupProps
}

export type CommonTemplateProps = {
  content?: string
  templateType: LegalGazetteHTMLTemplates.COMMON
}

export type BaseSettlement = {
  nationalId?: string
  name?: string
  dateOfDeath?: Date | string
  deadlineDate?: Date | string
  address?: string
  type?: 'default' | 'undivided' | 'owner'
  meetingDate?: Date | string
  meetingLocation?: string
  liquidatorName?: string
  liquidatorLocation?: string
  customLiquidatorLocation?: string
  statementType: 'location' | 'email' | 'custom'
  companies?: {
    companyName?: string
    companyNationalId?: string
  }[]
}

export type RecallBankruptcySettlement = Omit<
  BaseSettlement,
  'dateOfDeath' | 'companies' | 'type'
>

export type RecallDeceasedSettlement = Omit<
  BaseSettlement,
  'deadlineDate' | 'meetingDate' | 'meetingLocation'
>

export type RecallTemplateProps = {
  courtDistrict?: string
  judgementDate?: Date | string
  settlement?: BaseSettlement
}

export type RecallDeceasedTemplateProps = Omit<
  RecallTemplateProps,
  'settlement'
> & {
  templateType: LegalGazetteHTMLTemplates.RECALL_DECEASED
  settlement?: RecallDeceasedSettlement
}

export type RecallBankruptcyTemplateProps = Omit<
  RecallTemplateProps,
  'settlement'
> & {
  templateType: LegalGazetteHTMLTemplates.RECALL_BANKRUPTCY
  settlement?: RecallBankruptcySettlement
}

export type ForeclosureProperty = {
  number?: string
  name?: string
  respondent?: string
  claimant?: string
  totalPrice?: number
}

type ForeclosureTemplate = {
  foreclosureAddress?: string
  foreclosureDate?: Date | string
  properties?: Array<ForeclosureProperty>
}

export type ForeclosureTemplateProps = Omit<
  BaseTemplateProps,
  'templateType' | 'content'
> & {
  templateType: LegalGazetteHTMLTemplates.FORECLOSURE
  foreclosure?: ForeclosureTemplate
}

export type DivisionMeetingBankruptcyTemplateProps = {
  templateType: LegalGazetteHTMLTemplates.DIVISION_MEETING_BANKRUPTCY
  address?: string
  meetingDate?: string
  name?: string
  nationalId?: string
  meetingLocation?: string
  content?: string
}

export type DivisionMeetingDeceasedTemplateProps = {
  templateType: LegalGazetteHTMLTemplates.DIVISION_MEETING_DECEASED
  name?: string
  nationalId?: string
  meetingLocation?: string
  meetingDate?: string
  content?: string
}

export type DivisionEndingTemplateProps = {
  templateType:
    | LegalGazetteHTMLTemplates.DIVISION_ENDING_BANKRUPTCY
    | LegalGazetteHTMLTemplates.DIVISION_ENDING_DECEASED
  courtDistrict?: string
  judgementDate?: string
  endingDate?: Date | string
  settlementName?: string
  settlementNationalId?: string
  settlementDeclaredClaims?: string | number
  content?: string
}
