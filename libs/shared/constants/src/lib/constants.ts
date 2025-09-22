export const CLS_NAMESPACE = 'dmr.is:transaction'
export const DEFAULT_PAGE_SIZE = 10

export const DEFAULT_PAGE_NUMBER = 1
export const PAGING_MAXIMUM_PAGE_SIZE = 100

export const DEFAULT_CASE_SORT_BY = 'requestedPublicationDate'
export const DEFAULT_CASE_SORT_DIRECTION = 'ASC'

export const ONE_MINUTE = 60
export const ONE_HOUR = ONE_MINUTE * 60

export const ONE_KILO_BYTE = 1000
export const ONE_MEGA_BYTE = 1000 * 1000

export const PDF_RETRY_ATTEMPTS = 3
export const PDF_RETRY_DELAY = 5000

export const APPLICATION_FILES_BUCKET =
  'official-journal-application-files-bucket-dev'

export const ALLOWED_PDF_MIME_TYPES = ['application/pdf']
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export enum Filenames {
  Documents = 'Fylgiskjal',
  Appendix = 'Viðauki',
}

export const FAST_TRACK_DAYS = 10

export enum ApplicationEvent {
  Approve = 'APPROVE',
  Reject = 'REJECT',
  Edit = 'EDIT',
}

export enum SignatureTypeTitle {
  Regular = 'Hefðbundin undirritun',
  Committee = 'Undirritun nefndar',
}

export enum SignatureType {
  Regular = 'regular',
  Committee = 'committee',
}

export enum SignatureTypeSlug {
  Regular = 'hefdbundin-undirritun',
  Committee = 'undirritun-nefndar',
}

/**
 * Enum for attachment types, used for parameter routes when uploading attachments.
 */
export enum AttachmentTypeParam {
  OriginalDocument = 'frumrit',
  AdditonalDocument = 'fylgiskjol',
  SupportingDocument = 'fylgigogn',
  Assets = 'assets',
}

export enum AttachmentTypeEnum {
  OriginalDocument = 'Frumrit',
  AdditonalDocument = 'Fylgiskjöl',
  SupportingDocument = 'Fylgigögn',
}

export enum ApplicationStates {
  REQUIREMENTS = 'requirements',
  DRAFT = 'draft',
  DRAFT_RETRY = 'draft_retry',
  SUBMITTED = 'submitted',
  COMPLETE = 'complete',
}

export const ROLES_KEY = 'roles'

export const WITH_CASE_KEY = 'withCase'

export enum UserRoleEnum {
  Admin = 'Ritstjóri',
  Editor = 'Fulltrúi',
  User = 'Innsendandi',
}

export const PAGE_SIZE_OPTIONS = [
  {
    label: '10',
    value: 10,
  },
  {
    label: '20',
    value: 20,
  },
  {
    label: '50',
    value: 50,
  },
  {
    label: '100',
    value: 100,
  },
]
