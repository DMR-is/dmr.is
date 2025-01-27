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

/**
 * Actions that can be performed on a case
 */
export enum CaseActionEnum {
  /**
   * When a case is submitted by an institution/application-system
   */
  SUBMIT = 'SUBMIT',
  /**
   * When a admin assigns a case to another admin user
   */
  ASSIGN_USER = 'ASSIGN_USER',
  /**
   * When a admin assigns a case to themselves
   */
  ASSIGN_SELF = 'ASSIGN_SELF',
  /**
   * When a admin updates the status of the case
   */
  UPDATE_STATUS = 'UPDATE_STATUS',
  /**
   * When a admin adds a comment to the case
   */
  COMMENT_INTERNAL = 'INTERNAL_COMMENT',
  /**
   * When a external adds a comment to the case, available for all users
   */
  COMMENT_EXTERNAL = 'EXTERNAL_COMMENT',
  /**
   * When a application adds a comment to the case, available for all users
   */
  COMMENT_APPLICATION = 'APPLICATION_COMMENT',
}
