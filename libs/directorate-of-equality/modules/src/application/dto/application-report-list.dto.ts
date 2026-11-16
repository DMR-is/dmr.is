import {
  ApiBoolean,
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
 * Who filed a report, as the company's submissions list names it. Its own
 * enum rather than `ReportProviderEnum`, whose `OTHER` / `SYSTEM` are storage
 * names that mean nothing to a reader of My Pages.
 */
export enum ApplicationReportChannelEnum {
  /** Filed by the company itself through the island.is application. */
  ISLAND_IS = 'ISLAND_IS',
  /** Filed for the company by an approved service provider, over the partner API. */
  SERVICE_PROVIDER = 'SERVICE_PROVIDER',
  /** Entered by Jafnréttisstofa on the company's behalf. */
  DIRECTORATE = 'DIRECTORATE',
}

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
      'The handle the READ routes take: `GET /application/reports/:providerId`, its equality PDF, its outliers and its comment thread. A report filed on island.is is its bare application UUID; one a service provider filed is `partner:<the provider’s own id>`; one Jafnréttisstofa entered is `system:<id>`. URL-encode it as one path segment. The write routes (edit, outliers, comment, withdraw) accept only the bare island.is form, so a report filed through another channel is read-only here. Never the DoE-side `report.id`.',
  })
  providerId!: string

  @ApiEnum(ApplicationReportChannelEnum, {
    enumName: 'ApplicationReportChannelEnum',
    description:
      'Who filed the report: the company on island.is (`ISLAND_IS`), a service provider for it over the partner API (`SERVICE_PROVIDER`), or Jafnréttisstofa on its behalf (`DIRECTORATE`). Only `ISLAND_IS` reports can be edited, commented on or withdrawn here.',
  })
  submittedVia!: ApplicationReportChannelEnum

  @ApiBoolean({
    description:
      'True when the salary data was uploaded as the Excel workbook rather than entered in the form. Independent of `submittedVia`.',
  })
  importedFromExcel!: boolean

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
