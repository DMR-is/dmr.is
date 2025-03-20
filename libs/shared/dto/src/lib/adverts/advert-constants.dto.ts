export enum AdvertStatus {
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

export enum AdvertFeeType {
  Base = 'BASE',
  AdditionalDoc = 'ADDITIONAL_DOC',
  FastTrack = 'FAST_TRACK',
  BaseModifier = 'BASE_MODIFIER',
  ImageTier = 'IMAGE_TIER',
  Lowererd = 'LOWERED',
  Percentage = 'PERCENTAGE',
}
