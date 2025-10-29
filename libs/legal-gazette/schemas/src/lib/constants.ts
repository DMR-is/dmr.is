export enum CommonApplicationInputFields {
  TYPE = 'fields.typeId',
  CATEGORY = 'fields.categoryId',
  CAPTION = 'fields.caption',
  HTML = 'fields.html',
}

export enum RecallApplicationInputFields {
  COURT_DISTRICT_ID = 'fields.courtAndJudgment.courtDistrictId',
  JUDGEMENT_DATE = 'fields.courtAndJudgment.judgementDate',
  SETTLEMENT_NAME = 'fields.settlement.name',
  SETTLEMENT_NATIONAL_ID = 'fields.settlement.nationalId',
  SETTLEMENT_ADDRESS = 'fields.settlement.address',
  SETTLEMENT_DEADLINE_DATE = 'fields.settlement.deadlineDate',
  SETTLEMENT_DATE_OF_DEATH = 'fields.settlement.dateOfDeath',
  LIQUIDATOR_NAME = 'fields.liquidator.name',
  LIQUIDATOR_LOCATION = 'fields.liquidator.location',
  DIVISION_MEETING_DATE = 'fields.divisionMeeting.meetingDate',
  DIVISION_MEETING_LOCATION = 'fields.divisionMeeting.meetingLocation',
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
