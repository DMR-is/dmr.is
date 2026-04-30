import { ArrayMinSize } from 'class-validator'

import {
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
 * One row per employee flagged as a salary outlier. Populated by the company
 * after the salary-analysis preview step (see `db/README.md` Notes / open
 * questions). Persisted into `report_employee_outlier`.
 *
 * `postponed = true` means the company has acknowledged the outlier but is
 * deferring the explanation; `reason`, `action`, and the signature fields may
 * be omitted in that case. When `postponed = false`, all explanation fields
 * are required (validated server-side and at the DB CHECK constraint).
 */
export class CreateReportOutlierDto {
  @ApiNumber({
    description:
      'Ordinal of the employee in `parsed.employees[]` this outlier justification applies to.',
  })
  employeeOrdinal!: number

  @ApiOptionalBoolean({
    description:
      'When true, defers the explanation. Other fields may be omitted. Defaults to false.',
  })
  postponed?: boolean

  @ApiOptionalString({
    description: 'Required when `postponed` is false.',
  })
  reason?: string

  @ApiOptionalString({
    description: 'Required when `postponed` is false.',
  })
  action?: string

  @ApiOptionalString({
    description: 'Required when `postponed` is false.',
  })
  signatureName?: string

  @ApiOptionalString({
    description: 'Required when `postponed` is false.',
  })
  signatureRole?: string
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
   * Salary outliers the company has justified. Optional — empty/undefined is
   * fine when no outliers were flagged. Each entry references its employee
   * by `ordinal` from `parsed.employees[]`.
   */
  @ApiOptionalDtoArray(CreateReportOutlierDto)
  outliers?: CreateReportOutlierDto[]
}
