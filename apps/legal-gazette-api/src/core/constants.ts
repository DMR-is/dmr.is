export enum LegalGazetteEvents {
  CREATE_SUBMIT_COMMENT = 'advert.create.submit.comment',
  CREATE_PUBLISH_COMMENT = 'advert.create.publish.comment',
  ADVERT_PUBLISHED = 'advert.published',
  ADVERT_PUBLISHED_SIDE_EFFECTS = 'advert.published.side.effects',
  STATUS_CHANGED = 'advert.status.changed',
  USER_ASSIGNED = 'advert.user.assigned',
  SUBSCRIBER_CREATED = 'subscriber.created',
  DELETE_PUBLICATION = 'advert.publication.delete',
  CREATE_PUBLICATION = 'advert.publication.create',
}

export enum LegalGazetteModels {
  USER_ROLES = 'legal_gazette_user_roles',
  USERS = 'legal_gazette_users',
  ADVERT_TYPE = 'advert_type',
  ADVERT_CATEGORY = 'advert_category',
  ADVERT_STATUS = 'advert_status',
  CASE = 'cases',
  COMMUNICATION_CHANNEL = 'communication_channel',
  ADVERT = 'advert',
  ADVERT_PUBLICATION = 'advert_publication',
  APPLICATION = 'application',
  COURT_DISTRICT = 'court_district',
  SETTLEMENT = 'settlement',
  SUBSCRIBER = 'legal_gazette_subscribers',
  TYPE_CATEGORIES = 'type_categories',
  TBR_FEE_CODE = 'tbr_fee_code',
  TBR_TRANSACTION = 'tbr_transaction',
  SUBSCRIBER_TRANSACTION = 'subscriber_transaction',
  ADVERT_TYPE_FEE_CODE = 'advert_type_fee_code',
  COMMENT = 'advert_comment',
  FORECLOSURE = 'foreclosure',
  FORECLOSURE_PROPERTY = 'foreclosure_property',
  SIGNATURE = 'signature',
  DOCUMENT_ISSUE_SETTINGS = 'document_issue_settings',
  DOCUMENT_ISSUES = 'document_issues',
  TBR_COMPANY_SETTINGS = 'tbr_company_settings',
  SUBSCRIBER_PAYMENT = 'subscriber_payments',
  PUBLICATION_SEARCH_EVENT = 'publication_search_event',
  BACKFILLED_PUBLICATION = 'backfilled_publication',
  CATEGORY_TYPE_CHANGE_LOG = 'category_type_change_log',
}

export const RECALL_BANKRUPTCY_ADVERT_TYPE_ID =
  '065C3FD9-58D1-436F-9FB8-C1F5C214FA50'

export const RECALL_DECEASED_ADVERT_TYPE_ID =
  'BC6384F4-91B0-48FE-9A3A-B528B0AA6468'

export const RECALL_CATEGORY_ID = '7D0E4B20-2FDD-4CA9-895B-9E7792ECA6E5'

export const TASK_JOB_IDS = {
  issues: 1,
  payment: 2,
  publishing: 3,
}

export const TASK_NAMESPACE = 1000
export const USER_LOCK_NAMESPACE = 2000

export const SYSTEM_ACTOR_ID = 'system'
export const SYSTEM_ACTOR_NAME = 'Ritstjórnarkerfið'

export const SYSTEM_ACTOR = {
  id: SYSTEM_ACTOR_ID,
  name: SYSTEM_ACTOR_NAME,
}

// Written into additional-announcement content at creation, before the advert
// has a publication number. Swapped for the real number at render time.
export const PENDING_PUBLICATION_NUMBER = '(Reiknast við útgáfu)'
