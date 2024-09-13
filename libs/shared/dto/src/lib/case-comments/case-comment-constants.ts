/**
 * Represents the type of a case comment.
 * @enum {string} CaseCommentType
 *
 */
export enum CaseCommentTypeEnum {
  /**
   * When user submits the application
   */
  Submit = 'submit',

  /**
   * When an employee is assigned.
   */
  Assign = 'assign',

  /**
   * When case has no employee, and the emloyee assigns himself.
   */
  AssignSelf = 'assign-self',

  /**
   * When an employee changes the status of the case.
   */
  Update = 'update',

  /**
   * Internal comments only visible to admins.
   */
  Comment = 'comment',

  /**
   * Public comment available to all parties.
   */
  Message = 'message',
}

/**
 * Represents the title of a case comment.
 * @enum {string} CaseCommentTitle
 */
export enum CaseCommentTitleEnum {
  Submit = 'Innsent af:',
  Assign = 'færir mál á',
  AssignSelf = 'merkir sér málið.',
  UpdateStatus = 'færir mál í stöðuna:',
  Comment = 'gerir athugasemd.',
  Message = 'skráir skilaboð',
}
