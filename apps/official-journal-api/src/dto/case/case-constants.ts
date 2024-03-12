export enum CaseStatus {
  Submitted = 'Innsent',
  InProgress = 'Grunnvinnsla',
  InReview = 'Yfirlestur',
  ReadyForPublishing = 'Tilbúið',
}

export enum CaseTag {
  NotStarted = 'Ekki hafið',
  InReview = 'Í yfirlestri',
  MultipleReviewers = 'Samlesin',
  RequiresReview = 'Þarf skoðun',
}

export enum CaseTask {
  Submit = 'submit',
  Assign = 'assign',
  Update = 'update',
  Comment = 'comment',
}
