import {
  ApiDtoArray,
  ApiEnum,
  ApiOptionalDateTime,
  ApiOptionalEnum,
  ApiOptionalString,
  ApiString,
} from '@dmr.is/decorators'

import {
  ReportStatusEnum,
  ReportTypeEnum,
  SalaryDataBasisEnum,
} from '../../report/models/report.enums'

/**
 * One row of the signed-in company's submissions list.
 *
 * Deliberately a summary: everything heavier (comments, result, companies,
 * equality content) is behind `GET /application/reports/:providerId`, which
 * `providerId` here is the handle for.
 */
export class ApplicationReportListItemDto {
  @ApiString({
    description:
      'The handle for `GET /application/reports/:providerId` and every other `reports/:providerId` route — the submission id this caller filed under (on island.is, the application UUID). Never the DoE-side `report.id`, which resolves on no applicant route.',
  })
  providerId!: string

  // No per-property description: the hoisted enum schema takes the first
  // description it meets, which would overwrite the shared one.
  @ApiEnum(ReportTypeEnum, { enumName: 'ReportTypeEnum' })
  type!: ReportTypeEnum

  @ApiEnum(ReportStatusEnum, { enumName: 'ReportStatusEnum' })
  status!: ReportStatusEnum

  @ApiOptionalString({
    nullable: true,
    description:
      'Human-facing display code assigned by the Directorate. Not a lookup handle.',
  })
  identifier!: string | null

  @ApiOptionalDateTime({
    nullable: true,
    description:
      'When the report was filed — the same value as `submittedAt` on the report detail. The list is ordered by this, newest first.',
  })
  submittedAt!: Date | null

  @ApiOptionalDateTime({
    nullable: true,
    description: 'When a reviewer approved the report. Null until approved.',
  })
  approvedAt!: Date | null

  @ApiOptionalDateTime({
    nullable: true,
    description:
      'The end of the period an approved report covers (three years from approval). Null until approved.',
  })
  validUntil!: Date | null

  /**
   * Salary-only; null on equality reports. The description repeats the
   * submission DTO's word for word: this route is the first in the document
   * to reference the hoisted enum, so its text becomes the schema's.
   */
  @ApiOptionalEnum(SalaryDataBasisEnum, {
    nullable: true,
    enumName: 'SalaryDataBasisEnum',
    description:
      'Whether the salary data describes one specific payroll month (`MONTH`) or a twelve-month average (`AVERAGE`). The submittee must declare one.',
  })
  salaryDataBasis!: SalaryDataBasisEnum | null

  @ApiOptionalString({
    nullable: true,
    description:
      'Salary-only. The payroll month the data is based on, as `YYYY-MM-01`. Set when `salaryDataBasis` is `MONTH`, null otherwise.',
  })
  salaryDataPeriod!: string | null
}

export class GetApplicationReportsResponseDto {
  @ApiDtoArray(ApplicationReportListItemDto)
  reports!: ApplicationReportListItemDto[]
}
