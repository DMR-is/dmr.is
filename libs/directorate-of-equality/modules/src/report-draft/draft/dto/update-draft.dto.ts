import {
  ApiOptionalEnum,
  ApiOptionalHTML,
  ApiOptionalNumber,
  ApiOptionalString,
} from '@dmr.is/decorators'

import {
  GenderEnum,
  SalaryDataBasisEnum,
} from '../../../report/models/report.enums'

/**
 * Patch body for `PATCH /api/v1/application/reports/:providerId/draft`. Every
 * field is optional — PATCH semantics: an omitted key is left untouched, an
 * explicit `null` clears the column. Type-specific fields (the headcount
 * figures for SALARY, `equalityReportContent` for EQUALITY) are not enforced
 * here; cross-field validity is checked at submit, not while drafting.
 */
export class UpdateDraftDto {
  @ApiOptionalString({ nullable: true })
  companyAdminName?: string | null

  @ApiOptionalString({
    nullable: true,
    description: 'Job title (starfsheiti) of the company executive.',
  })
  companyAdminTitle?: string | null

  @ApiOptionalString({ nullable: true })
  companyAdminEmail?: string | null

  @ApiOptionalEnum(GenderEnum, { nullable: true, enumName: 'GenderEnum' })
  companyAdminGender?: GenderEnum | null

  @ApiOptionalString({ nullable: true })
  contactName?: string | null

  @ApiOptionalString({
    nullable: true,
    description: 'Job title (starfsheiti) of the company contact (tengiliður).',
  })
  contactTitle?: string | null

  @ApiOptionalString({ nullable: true })
  contactEmail?: string | null

  @ApiOptionalString({ nullable: true })
  contactPhone?: string | null

  @ApiOptionalNumber({ nullable: true })
  averageEmployeeMaleCount?: number | null

  @ApiOptionalNumber({ nullable: true })
  averageEmployeeFemaleCount?: number | null

  @ApiOptionalNumber({ nullable: true })
  averageEmployeeNeutralCount?: number | null

  @ApiOptionalEnum(SalaryDataBasisEnum, {
    nullable: true,
    enumName: 'SalaryDataBasisEnum',
    description:
      'Salary-only. Whether the salary data describes one specific payroll month (`MONTH`) or a twelve-month average (`AVERAGE`). Setting `AVERAGE` clears `salaryDataPeriod`, and so does clearing the basis itself. Required to submit a salary report.',
  })
  salaryDataBasis?: SalaryDataBasisEnum | null

  @ApiOptionalString({
    nullable: true,
    description:
      'The payroll month the salary data is based on, as an ISO date (`YYYY-MM-DD`; any day within the month is accepted and normalised to the 1st). Must name a month that has already happened, no earlier than 36 months ago. Required alongside `salaryDataBasis: MONTH` by submit time; ignored while the stored basis is `AVERAGE`.',
  })
  salaryDataPeriod?: string | null

  @ApiOptionalHTML({
    nullable: true,
    description:
      'Narrative gender-equality plan as base64-encoded HTML. Decoded server-side and persisted as `report.equality_report_content`.',
  })
  equalityReportContent?: string | null
}
