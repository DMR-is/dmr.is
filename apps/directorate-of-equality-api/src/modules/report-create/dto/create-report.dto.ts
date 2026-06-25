import { ArrayMinSize, IsInt } from 'class-validator'

import {
  ApiArray,
  ApiBoolean,
  ApiDto,
  ApiDtoArray,
  ApiEnum,
  ApiNumber,
  ApiOptionalBoolean,
  ApiOptionalDtoArray,
  ApiOptionalString,
  ApiOptionalUUID,
  ApiString,
  ApiUUID,
} from '@dmr.is/decorators'

import {
  GenderEnum,
  ReportProviderEnum,
} from '../../report/models/report.enums'
import { ParsedReportDto } from '../../report-excel/dto/parsed-report.dto'

/**
 * One outlier group the company defined after the salary-analysis preview step
 * (see `db/README.md` Notes / open questions). Persisted into
 * `report_outlier_group`, with one `report_employee_outlier` row per covered
 * employee pointing at it.
 *
 * Only used when the parent report is NOT postponed — see
 * `CreateReportDto.outliersPostponed`. The applicant supplies the shared
 * explanation (all four fields required, non-empty) plus the ordinals of the
 * detected outliers this group covers. Across all groups every detected
 * outlier must be covered by exactly one group (validated server-side). When
 * the parent is postponed, no groups are created — the outlier rows are
 * written with `group_id = NULL` and resolved later via the outliers edit
 * endpoint.
 */
export class CreateReportOutlierGroupDto {
  @ApiOptionalString({
    description:
      'Applicant-supplied label for the group. Not required to be unique. When omitted (the implicit single-group case) the server assigns a default name.',
  })
  name?: string

  @ApiString({ minLength: 1 })
  reason!: string

  @ApiString({ minLength: 1 })
  action!: string

  @ApiString({ minLength: 1 })
  signatureName!: string

  @ApiString({ minLength: 1 })
  signatureRole!: string

  @ApiArray({
    type: [Number],
    description:
      'Ordinals of the employees in `parsed.employees[]` this group covers.',
  })
  @ArrayMinSize(1)
  @IsInt({ each: true })
  employeeOrdinals!: number[]
}

export class CreateReportCompanySnapshotDto {
  @ApiUUID({ description: 'FK to the live company row' })
  companyId!: string

  @ApiOptionalUUID({
    nullable: true,
    description:
      'Parent company FK (nullable). Null on the top-level reporting company; set on each subsidiary.',
  })
  parentCompanyId!: string | null

  @ApiString()
  name!: string

  @ApiString()
  nationalId!: string

  @ApiString()
  address!: string

  @ApiString()
  city!: string

  @ApiString()
  postcode!: string

  @ApiString()
  isatCategory!: string
}

/**
 * Request body for `POST /api/v1/reports/salary`. Combines submission
 * metadata that the application/auth context owns with the parsed workbook
 * payload that `POST /api/v1/reports/excel/import` returned earlier.
 */
export class CreateReportDto {
  @ApiUUID({
    description:
      'FK to the approved EQUALITY report this salary was audited against.',
  })
  equalityReportId!: string

  @ApiString()
  identifier!: string

  @ApiBoolean()
  importedFromExcel!: boolean

  @ApiEnum(ReportProviderEnum)
  providerType!: ReportProviderEnum

  @ApiOptionalString({ nullable: true })
  providerId!: string | null

  @ApiString()
  companyAdminName!: string

  @ApiString()
  companyAdminEmail!: string

  @ApiEnum(GenderEnum)
  companyAdminGender!: GenderEnum

  @ApiString()
  contactName!: string

  @ApiString()
  contactEmail!: string

  @ApiString()
  contactPhone!: string

  @ApiNumber()
  averageEmployeeMaleCount!: number

  @ApiNumber()
  averageEmployeeFemaleCount!: number

  @ApiNumber()
  averageEmployeeNeutralCount!: number

  @ApiDto(ParsedReportDto, {
    description:
      'Parsed workbook payload from `POST /reports/excel/import`. Contains the criteria tree, role list, and employee rows.',
  })
  parsed!: ParsedReportDto

  /**
   * One snapshot row per participating company. Multi-company submissions
   * carry the parent on the first row (`parentCompanyId = null`) and each
   * subsidiary as a follow-up row pointing at the parent's `companyId`.
   */
  @ApiDtoArray(CreateReportCompanySnapshotDto)
  @ArrayMinSize(1)
  companies!: CreateReportCompanySnapshotDto[]

  /**
   * All-or-none. When true, the company is acknowledging every detected
   * outlier but deferring the explanations — `outlierGroups` is ignored and no
   * groups are created. The outlier rows are written with `group_id = NULL`
   * and resolved later via the outliers edit endpoint. When false (default),
   * `outlierGroups` must cover every detected outlier exactly once.
   */
  @ApiOptionalBoolean({
    description:
      'When true, defers every outlier explanation on this report. Defaults to false.',
  })
  outliersPostponed?: boolean

  /**
   * Outlier groups the company has defined. Required (non-empty) when the
   * report has detected outliers and is not postponed: the union of each
   * group's `employeeOrdinals` must cover every detected outlier exactly once.
   * Ignored when `outliersPostponed` is true. Omit when no outliers were
   * detected.
   */
  @ApiOptionalDtoArray(CreateReportOutlierGroupDto)
  outlierGroups?: CreateReportOutlierGroupDto[]
}
