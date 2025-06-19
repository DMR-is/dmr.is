export const LEGAL_GAZETTE_NAMESPACE = 'legal-gazette'

export const LEGAL_GAZETTE_DEFAULT_ROLE_ID =
  '93bc4ffa-d3c2-4519-abd2-5f4bcbad700e'

export enum LegalGazetteModels {
  USER_ROLES = 'legal_gazette_user_roles',
  INSTITUTIONS = 'legal_gazette_institutions',
  USERS = 'legal_gazette_users',
  USER_INSTITUTIONS = 'legal_gazette_user_institutions',
  ADVERT_TYPE = 'advert_type',
  ADVERT_CATEGORY = 'advert_category',
  ADVERT_STATUS = 'advert_status',
  CASE = 'cases',
  COMMUNICATION_CHANNEL = 'communication_channel',
  ADVERT = 'advert',
  COMMON_ADVERT = 'common_advert',
}

export enum LegalGazetteEvents {
  COMMON_APPLICATION_UPDATE = 'common-application.update',
}
