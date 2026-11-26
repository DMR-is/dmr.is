import { IsEmail, Min, ValidateIf } from 'class-validator'

import {
  ApiOptionalBase64File,
  ApiOptionalEnum,
  ApiOptionalHTML,
  ApiOptionalNumber,
  ApiOptionalString,
} from '@dmr.is/decorators'

import { TrimString } from '../../../report/lib/trim-string'
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

  // A draft may hold a blank address while it is being filled in; any
  // address it does hold must be one, as the filing DTOs require.
  @ApiOptionalString({ nullable: true })
  @TrimString()
  @ValidateIf((_, value) => value !== '')
  @IsEmail()
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
  @TrimString()
  @ValidateIf((_, value) => value !== '')
  @IsEmail()
  contactEmail?: string | null

  @ApiOptionalString({ nullable: true })
  @TrimString()
  contactPhone?: string | null

  @ApiOptionalNumber({ nullable: true })
  @Min(0)
  averageEmployeeMaleCount?: number | null

  @ApiOptionalNumber({ nullable: true })
  @Min(0)
  averageEmployeeFemaleCount?: number | null

  @ApiOptionalNumber({ nullable: true })
  @Min(0)
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
      'The payroll month the salary data is based on, as an ISO date (`YYYY-MM-DD`; any day within the month is accepted and normalised to the 1st). Must name a month that is over — last month at the latest — and no earlier than 36 months ago. Required alongside `salaryDataBasis: MONTH` by submit time; ignored while the stored basis is `AVERAGE`.',
  })
  salaryDataPeriod?: string | null

  @ApiOptionalHTML({
    nullable: true,
    description:
      'Narrative gender-equality plan as base64-encoded HTML. Decoded server-side and persisted as `report.equality_report_content`. Mutually exclusive with `equalityReportPdf`.',
  })
  equalityReportContent?: string | null

  @ApiOptionalBase64File({
    nullable: true,
    description:
      'Narrative gender-equality plan as a base64-encoded PDF, stored verbatim. Mutually exclusive with `equalityReportContent` and `equalityReportPdfKey`. Max 4MB decoded.',
  })
  equalityReportPdf?: string | null

  @ApiOptionalString({
    nullable: true,
    description:
      'File name of the uploaded PDF, shown in the review UI. Required when `equalityReportPdf` or `equalityReportPdfKey` is supplied.',
  })
  equalityReportPdfFilename?: string | null

  @ApiOptionalString({
    nullable: true,
    maxLength: 256,
    description:
      'Object key from `POST …/equality-content/presign` for a plan PDF already uploaded to the presigned URL. Stored exactly as an inline `equalityReportPdf` would be (max 4MB, must be a PDF). Requires `equalityReportPdfFilename`. Cannot be combined with a non-empty `equalityReportPdf` or `equalityReportContent` (400); a null beside the key is ignored and the key wins. **Single use:** a successful request consumes the upload. Resending the key while it still names the current plan of the draft (a retry after a lost response) succeeds without changing the plan; once the plan has been replaced it fails the whole PATCH, header fields included, so omit the key from later saves. A null or empty key is ignored; clear the plan with `equalityReportContent: null`.',
  })
  equalityReportPdfKey?: string | null
}
