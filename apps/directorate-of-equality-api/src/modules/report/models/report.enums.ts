/**
 * Enums used across the report domain. Lifted out of `report.model.ts` so
 * sibling models (e.g. `report-comment.model.ts`) can import them without
 * triggering a circular import back into `report.model.ts`. The original
 * `report.model.ts` re-exports them so existing callers continue to work.
 */

export enum ReportTypeEnum {
  SALARY = 'SALARY',
  EQUALITY = 'EQUALITY',
}

export enum ReportStatusEnum {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  DENIED = 'DENIED',
  APPROVED = 'APPROVED',
  SUPERSEDED = 'SUPERSEDED',
}

export enum GenderEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  NEUTRAL = 'NEUTRAL',
}

export enum ReportProviderEnum {
  SYSTEM = 'SYSTEM',
  ISLAND_IS = 'ISLAND_IS',
  OTHER = 'OTHER',
}
