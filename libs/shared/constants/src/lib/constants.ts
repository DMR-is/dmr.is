export const DEFAULT_PAGE_SIZE = 10
export const PAGING_MAXIMUM_PAGE_SIZE = 100

export const ONE_MINUTE = 60
export const ONE_HOUR = ONE_MINUTE * 60

export const ONE_KILO_BYTE = 1000
export const ONE_MEGA_BYTE = 1000 * 1000

export const APPLICATION_FILES_BUCKET =
  'official-journal-application-files-bucket-dev'

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
}

export enum SignatureTypeTitle {
  Regular = 'Hefðbundin undirritun',
  Committee = 'Undirritun nefndar',
}

export enum SignatureTypeSlug {
  Regular = 'hefdbundin-undirritun',
  Committee = 'undirritun-nefndar',
}

/**
 * Enum for attachment types, used for parameter routes when uploading attachments.
 */
export enum AttachmentTypeParams {
  OriginalDocument = 'frumrit',
  AdditonalDocument = 'fylgiskjol',
}
