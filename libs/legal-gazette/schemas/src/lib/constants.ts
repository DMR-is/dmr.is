import z from 'zod'

export enum ApplicationTypeEnum {
  COMMON = 'COMMON',
  RECALL_BANKRUPTCY = 'RECALL_BANKRUPTCY',
  RECALL_DECEASED = 'RECALL_DECEASED',
}
export const ApplicationTypeSchema = z.enum(ApplicationTypeEnum)

export enum CommonApplicationInputFields {
  TYPE = 'fields.typeId',
  CATEGORY = 'fields.categoryId',
  CAPTION = 'fields.caption',
  HTML = 'fields.html',
}

export enum RecallApplicationInputFields {
  COURT_DISTRICT_ID = 'fields.courtAndJudgmentFields.courtDistrictId',
  JUDGMENT_DATE = 'fields.courtAndJudgmentFields.judgmentDate',
  SETTLEMENT_NAME = 'fields.settlementFields.name',
  SETTLEMENT_NATIONAL_ID = 'fields.settlementFields.nationalId',
  SETTLEMENT_ADDRESS = 'fields.settlementFields.address',
  SETTLEMENT_DEADLINE_DATE = 'fields.settlementFields.deadlineDate',
  SETTLEMENT_DATE_OF_DEATH = 'fields.settlementFields.dateOfDeath',
  LIQUIDATOR_NAME = 'fields.liquidatorFields.name',
  LIQUIDATOR_LOCATION = 'fields.liquidatorFields.location',
  DIVISION_MEETING_DATE = 'fields.divisionMeetingFields.meetingDate',
  DIVISION_MEETING_LOCATION = 'fields.divisionMeetingFields.meetingLocation',
  RECALL_REQUIREMENT_STATEMENT_TYPE = 'fields.liquidatorFields.recallRequirementStatementType',
  RECALL_REQUIREMENT_STATEMENT_LOCATION = 'fields.liquidatorFields.recallRequirementStatementLocation',
}

export enum ApplicationInputFields {
  APPLICATION_ID = 'metadata.applicationId',
  CASE_ID = 'metadata.caseId',
  TYPE_OPTIONS = 'metadata.typeOptions',
  COURT_DISTRICT_OPTIONS = 'metadata.courtDistrictOptions',
  ADDITIONAL_TEXT = 'additionalText',
  COMMUNICATION_CHANNELS = 'communicationChannels',
  SIGNATURE_NAME = 'signature.name',
  SIGNATURE_LOCATION = 'signature.location',
  SIGNATURE_ON_BEHALF_OF = 'signature.onBehalfOf',
  SIGNATURE_DATE = 'signature.date',
  PUBLISHING_DATES = 'publishingDates',
}

export enum ApplicationRequirementStatementEnum {
  LIQUIDATORLOCATION = 'LIQUIDATOR_LOCATION',
  CUSTOMLIQUIDATORLOCATION = 'CUSTOM_LIQUIDATOR_LOCATION',
  CUSTOMLIQUIDATOREMAIL = 'CUSTOM_LIQUIDATOR_EMAIL',
}
