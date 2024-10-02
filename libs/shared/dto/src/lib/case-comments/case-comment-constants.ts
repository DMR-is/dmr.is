/**
 * Represents the type of a case comment.
 * @enum {string} CaseCommentTypeTitleEnum
 */

export enum CaseCommentTypeTitleEnum {
  Submit = 'Innsent af:',
  Assign = 'færir mál á',
  AssignSelf = 'merkir sér málið.',
  UpdateStatus = 'færir mál í stöðuna:',
  Comment = 'gerir athugasemd.',
  Message = 'skráir skilaboð',
}

export enum CaseCommentSourceEnum {
  API = 'API',
  Application = 'Application',
}

export enum CaseCommentDirectionEnum {
  Sent = 'sent',
  Received = 'received',
}
