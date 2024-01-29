export const PAGING_MAXIMUM_PAGE_SIZE = 100

export enum JournalAdvertStatus {
  Active = 'Virk',
  Revoked = 'Afturkölluð',
  Draft = 'Drög',
  Old = 'Eldri auglýsing',
  Rejected = 'Hafnað',
  Waiting = 'Í bið',
  InProgress = 'Í vinnslu',
  Submitted = 'Innsend',
  ReadyForPublication = 'Tilbúin til útgáfu',
  Published = 'Útgefin',
}
