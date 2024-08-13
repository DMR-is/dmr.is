export const DEFAULT_PAGE_SIZE = 10
export const PAGING_MAXIMUM_PAGE_SIZE = 100

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
