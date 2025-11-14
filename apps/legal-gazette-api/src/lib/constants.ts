export enum LegalGazetteEvents {
  ADVERT_CREATED = 'advert.created',
  ADVERT_PUBLISHED = 'advert.published',
  STATUS_CHANGED = 'advert.status.changed',
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
  ADVERT_TYPE_FEE_CODE = 'advert_type_fee_code',
  COMMENT = 'advert_comment',
  FORECLOSURE = 'foreclosure',
  FORECLOSURE_PROPERTY = 'foreclosure_property',
}

export const RECALL_BANKRUPTCY_ADVERT_TYPE_ID =
  '065C3FD9-58D1-436F-9FB8-C1F5C214FA50'

export const RECALL_DECEASED_ADVERT_TYPE_ID =
  'BC6384F4-91B0-48FE-9A3A-B528B0AA6468'

export const RECALL_CATEGORY_ID = '7D0E4B20-2FDD-4CA9-895B-9E7792ECA6E5'

export const COMMON_ADVERT_TYPES_IDS = [
  '6e4317f5-debe-4617-854b-4b3b1fcb6ac7',
  '458ed90a-e3ca-4f2d-b8e0-06f7fca1f773',
  '28f5f353-e0ad-4089-b575-adb79f36c4b1',
  '76c73f48-fc5c-46d3-aa41-71888ee44d8a',
  'e24f0447-de59-4ebb-b272-74f8d2469050',
  'a568ee24-cd88-453f-8f9a-85b5adb22fc1',
  '2c75685d-7515-4b3a-aa32-a5dab7f8926b',
  'e35498be-da79-41d1-a2a0-cbef3a51331c',
  '91c5dbf4-13db-441b-8174-bcf8366720fa',
  'd86fca7c-bf0a-41b3-b227-bd906c563d48',
  '0f7cdbf1-74ac-499b-9d9a-9010bee3c4a3',
  'ee441d8c-6dea-4bff-931f-cbd9b8e29134',
  '1fd87583-39f1-4405-8f8e-6053d0f93004',
  '9910b500-094a-45d0-a6e1-299b860d672e',
  '508ed65b-17d3-4866-a40f-992dba39f151',
  '861bff25-b3c2-48c2-8ac5-ccfa61409552',
  '44b873a0-21d2-4bcb-8351-9aedab4571aa',
  '1a2f84b7-970e-43fe-b05a-af06d58cc2f9',
  '393ce2f9-a766-4891-b22c-180dfda1039e',
  '4b2d50f8-9bec-46fa-95f9-fdcf8ac36391',
  'cc18a165-b359-45b2-b587-aae21a09b565',
  '06f349ce-bda5-43d5-afae-4d658ed17b51',
  'b4b31515-b759-44c9-88d2-f33da574ea72',
]

export const UNASSIGNABLE_CATEGORY_IDS = [
  '52112993-EDCE-46A1-B7E6-8E3E5CD296F6', // Allar auglýsingar
]

export const UNASSIGNABLE_TYPE_IDS = [
  '82425CC8-B32E-4ADE-9EE4-BC6F8261B735', // Almennar auglýsingar
]
