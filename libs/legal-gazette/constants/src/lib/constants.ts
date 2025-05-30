export const CASE_STATUS_SUBMITTED_ID = 'cd3bf301-52a1-493e-8c80-a391c310c840'
export const COMMON_APPLICATION_TYPE_ID = 'a58fe2a8-b0a9-47bd-b424-4b9cece0e622'
export enum LegalGazetteApiTags {
  APPLICATION_API = 'Legal Gazette Applications',
  ADMIN_API = 'Legal Gazette Admin',
}

export const LEGAL_GAZETTE_NAMESPACE = 'legal-gazette'

export enum LegalGazetteModels {
  CASE_TYPE = 'case_type',
  CASE_CATEGORY = 'case_category',
  CASE_STATUS = 'case_status',
  CASES = 'cases',
  CASE_PUBLICATION_DATES = 'case_publication_dates',
  COMMUNICATION_CHANNEL = 'communication_channel',
  COMMON_CASE = 'common_case',
  ADVERT = 'advert',
}

export enum LegalGazetteApplicationTypes {
  COMMON_APPLICATION = 'almenn-auglysing',
}

export enum LegalGazetteEvents {
  COMMON_APPLICATION_SUBMITTED = 'common-application.submitted',
}
