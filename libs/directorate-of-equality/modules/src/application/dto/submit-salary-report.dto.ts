import {
  ApiBoolean,
  ApiDto,
  ApiEnum,
  ApiNumber,
  ApiOptionalBoolean,
  ApiOptionalDtoArray,
  ApiOptionalString,
  ApiOptionalUUID,
  ApiString,
} from '@dmr.is/decorators'

import {
  GenderEnum,
  SalaryDataBasisEnum,
} from '../../report/models/report.enums'
import { CreateReportOutlierGroupDto } from '../../report-create/dto/create-report.dto'
import { ParsedReportDto } from '../../report-excel/dto/parsed-report.dto'
import {
  SubmitReportCompanyDto,
  SubmitReportSubsidiaryDto,
} from './submit-report-company.dto'

/**
 * The report identifier is not supplied: it is a meaningless pseudonymous
 * handle, minted server-side at creation and returned on the report reads.
 *
 * `identifier` was accepted here until #1406, and a caller still sending one is
 * silently ignored rather than rejected — see db/README.md → "Report identifier"
 * for the island.is client change that pairs with its removal.
 */
export class SubmitSalaryReportDto {
  /**
   * Optional since legacy coverage became fileable. A company whose equality
   * plan exists only on the Directorate's retired register has no report id to
   * send — `GET reports/equality/active` answers `source: LEGACY` with a null
   * `id` for exactly those companies — and requiring the field left them unable
   * to submit at all. Omit it and the server resolves the same coverage the
   * eligibility route reported, which is also what the partner API does on
   * every submission.
   */
  @ApiOptionalUUID({
    // `nullable`, not just optional, and for a concrete reason: the value comes
    // straight off `GET reports/equality/active`, whose `id` is null on LEGACY
    // coverage. A client that forwards that null unchanged — the obvious thing
    // to write — must not be sending something the published contract forbids.
    // `IsOptional()` already skips null at runtime, so this documents what the
    // server has always accepted rather than widening it.
    nullable: true,
    description:
      'FK to the approved EQUALITY report this salary was audited against. Send null, or omit it, when `GET reports/equality/active` answered `source: LEGACY` (there is no id to send) — or to have the server resolve the company’s current coverage, which is the same answer that route gave.',
  })
  equalityReportId?: string | null

  @ApiBoolean()
  importedFromExcel!: boolean

  // Deliberately not a UUID. The field is the caller's own submission id,
  // and demanding that shape of it forced any vendor whose ids are not
  // UUIDs — `2026-Q1-042` is the example this API's own guide published,
  // and it was rejected — to keep a mapping table for a value we only ever
  // compare for equality. The bound replaces the format: the
  // `(provider_type, provider_id)` uniqueness and the partner channel's
  // kennitala namespacing are what carry the safety, never the shape.
  // island.is keeps sending its application UUID, which still validates.
  @ApiString({
    minLength: 1,
    maxLength: 256,
    description:
      'The caller’s own identifier for this submission, stored as the report provider_id. Any non-empty string: island.is sends the upstream application UUID, while a partner vendor sends whatever its own system mints — the format carries no meaning here. Uniqueness is enforced on `(provider_type, provider_id)`, and the partner channel namespaces the value with the authenticated company’s kennitala, so the safety comes from the key rather than the shape.',
  })
  providerId!: string

  @ApiString()
  companyAdminName!: string

  @ApiOptionalString({
    nullable: true,
    description: 'Job title (starfsheiti) of the company executive.',
  })
  companyAdminTitle?: string | null

  @ApiString()
  companyAdminEmail!: string

  @ApiEnum(GenderEnum)
  companyAdminGender!: GenderEnum

  @ApiString()
  contactName!: string

  @ApiOptionalString({
    nullable: true,
    description: 'Job title (starfsheiti) of the company contact (tengiliður).',
  })
  contactTitle?: string | null

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

  @ApiEnum(SalaryDataBasisEnum, {
    enumName: 'SalaryDataBasisEnum',
    description:
      'Whether the salary data describes one specific payroll month (`MONTH`) or a twelve-month average (`AVERAGE`). The submittee must declare one.',
  })
  salaryDataBasis!: SalaryDataBasisEnum

  @ApiOptionalString({
    nullable: true,
    description:
      'The payroll month the data is based on, as an ISO date (`YYYY-MM-DD`; any day within the month is accepted and normalised to the 1st). Required when `salaryDataBasis` is `MONTH`, ignored for `AVERAGE`. Must name a month that has already happened, no earlier than 36 months ago.',
  })
  salaryDataPeriod?: string | null

  @ApiDto(ParsedReportDto, {
    description:
      'Parsed workbook payload from `POST /reports/excel/import`. Contains the criteria tree, role list, and employee rows.',
  })
  parsed!: ParsedReportDto

  @ApiDto(SubmitReportCompanyDto)
  company!: SubmitReportCompanyDto

  @ApiOptionalDtoArray(SubmitReportSubsidiaryDto)
  subsidiaries?: SubmitReportSubsidiaryDto[]

  @ApiOptionalBoolean({
    description:
      'When true, defers every outlier explanation on this report. Defaults to false. All-or-none — postponement applies to the whole report, not individual rows.',
  })
  outliersPostponed?: boolean

  @ApiOptionalDtoArray(CreateReportOutlierGroupDto)
  outlierGroups?: CreateReportOutlierGroupDto[]
}
