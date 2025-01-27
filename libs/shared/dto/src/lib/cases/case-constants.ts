export enum CaseStatusEnum {
  Submitted = 'Innsent',
  InProgress = 'Grunnvinnsla',
  InReview = 'Yfirlestur',
  ReadyForPublishing = 'Tilbúið',
  Published = 'Útgefið',
  Unpublished = 'Tekið úr birtingu',
  Rejected = 'Birtingu hafnað',
}

export enum DepartmentSlugEnum {
  A = 'a-deild',
  B = 'b-deild',
  C = 'c-deild',
}

export enum DepartmentEnum {
  A = 'A deild',
  B = 'B deild',
  C = 'C deild',
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

export enum CaseActionEnum {
  SUBMIT = 'SUBMIT',
  ASSIGN_USER = 'ASSIGN_USER',
  ASSIGN_SELF = 'ASSIGN_SELF',
  UPDATE_STATUS = 'UPDATE_STATUS',
  COMMENT_INTERNAL = 'INTERNAL_COMMENT',
  COMMENT_EXTERNAL = 'EXTERNAL_COMMENT',
  COMMENT_APPLICATION = 'APPLICATION_COMMENT',
}
