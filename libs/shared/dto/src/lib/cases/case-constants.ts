export enum CaseStatusEnum {
  Submitted = 'Innsent',
  InProgress = 'Grunnvinnsla',
  InReview = 'Yfirlestur',
  ReadyForPublishing = 'Tilbúið',
  Published = 'Útgefið',
  Unpublished = 'Tekið úr birtingu',
  Rejected = 'Birtingu hafnað',
}

export enum CaseCommunicationStatus {
  NotStarted = 'Ekki hafin',
  WaitingForAnswers = 'Beðið eftir svörum',
  HasAnswers = 'Svör hafa borist',
  Done = 'Lokið',
}

export enum CaseTagEnum {
  NotStarted = 'Ekki hafið',
  InReview = 'Í yfirlestri',
  MultipleReviewers = 'Samlesin',
  RequiresReview = 'Þarf skoðun',
}

export enum AdditionType {
  Html = 'html',
  File = 'file',
}
