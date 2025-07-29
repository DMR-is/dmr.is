export const LEGAL_GAZETTE_NAMESPACE = 'legal-gazette'

export enum LegalGazetteModels {
  USER_ROLES = 'legal_gazette_user_roles',
  USERS = 'legal_gazette_users',
  ADVERT_TYPE = 'advert_type',
  ADVERT_CATEGORY = 'advert_category',
  ADVERT_STATUS = 'advert_status',
  CASE = 'cases',
  COMMUNICATION_CHANNEL = 'communication_channel',
  ADVERT = 'advert',
  COMMON_ADVERT = 'common_advert',
  COURT_DISTRICT = 'court_district',
  SETTLEMENT = 'settlement',
  BANKRUPTCY_ADVERT = 'bankruptcy_advert',
  BANKRUPTCY_APPLICATION = 'bankruptcy_application',
  SUBSCRIBER = 'legal_gazette_subscribers',
}

export enum LegalGazetteEvents {
  COMMON_APPLICATION_UPDATE = 'common-application.update',
}
