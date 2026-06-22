export const CLS_NAMESPACE = 'directory-of-equality-api:transaction'

export enum DoeModels {
  USER = 'doe_user',
  REGION = 'region',
  POSTCODE = 'postcode',
  COMPANY = 'company',
  COMPANY_REPORT = 'company_report',
  REPORT = 'report',
  REPORT_CRITERION = 'report_criterion',
  REPORT_SUB_CRITERION = 'report_sub_criterion',
  REPORT_SUB_CRITERION_STEP = 'report_sub_criterion_step',
  REPORT_EMPLOYEE = 'report_employee',
  REPORT_EMPLOYEE_ROLE = 'report_employee_role',
  REPORT_EMPLOYEE_OUTLIER = 'report_employee_outlier',
  REPORT_OUTLIER_GROUP = 'report_outlier_group',
  REPORT_EMPLOYEE_ROLE_CRITERION_STEP = 'report_employee_role_criterion_step',
  REPORT_EMPLOYEE_PERSONAL_CRITERION_STEP = 'report_employee_personal_criterion_step',
  REPORT_RESULT = 'report_result',
  REPORT_ROLE_RESULT = 'report_role_result',
  PUBLIC_REPORT = 'public_report',
  REPORT_EVENT = 'report_event',
  REPORT_COMMENT = 'report_comment',
  COMPANY_EVENT = 'company_event',
  COMPANY_COMMENT = 'company_comment',
  CONFIG = 'config',
}

/**
 * Name assigned to the auto-created outlier group when the applicant submits a
 * salary report without explicitly grouping the detected outliers. `name` is
 * NOT NULL on `report_outlier_group`; this is the value used for the implicit
 * single-group case (the frontend may choose to hide the name when there is
 * only one default group).
 */
export const DEFAULT_OUTLIER_GROUP_NAME = 'Sjálfgefinn hópur'
