import {
  ApiBoolean,
  ApiDtoArray,
  ApiEnum,
  ApiNumber,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiString,
} from '@dmr.is/decorators'

/**
 * Outcome categories for a single company in an import run. Drives both the
 * per-row result lists and the totals.
 */
export enum CompanyImportOutcomeEnum {
  /** In the file, not in our DB → will be created. */
  CREATED = 'CREATED',
  /** In file + DB, ≥1 authoritative field differs → fields updated. */
  UPDATED = 'UPDATED',
  /** In file + DB, identical and already ACTIVE → no change. */
  UNCHANGED = 'UNCHANGED',
  /** In DB (was ACTIVE), absent from file → status set to UNKNOWN. */
  MARKED_UNKNOWN = 'MARKED_UNKNOWN',
  /** In file, was UNKNOWN/INACTIVE → status flipped back to ACTIVE. */
  REACTIVATED = 'REACTIVATED',
}

export class CompanyImportFieldChangeDto {
  @ApiString({ description: 'Company field that changed, e.g. "name".' })
  field!: string

  @ApiOptionalString({ nullable: true, description: 'Previous value.' })
  from!: string | null

  @ApiOptionalString({ nullable: true, description: 'New value from the file.' })
  to!: string | null
}

export class CompanyImportRowResultDto {
  @ApiString()
  nationalId!: string

  @ApiString()
  name!: string

  @ApiEnum(CompanyImportOutcomeEnum, { enumName: 'CompanyImportOutcomeEnum' })
  outcome!: CompanyImportOutcomeEnum

  @ApiDtoArray(CompanyImportFieldChangeDto, {
    description: 'Field-level diff (UPDATED / REACTIVATED only).',
  })
  changedFields!: CompanyImportFieldChangeDto[]

  @ApiOptionalString({
    nullable: true,
    description: 'Soft notice, e.g. an unresolved postcode that was left unset.',
  })
  note!: string | null
}

export class CompanyImportErrorDto {
  @ApiNumber({ description: 'Spreadsheet row number (1-based, incl. header).' })
  row!: number

  @ApiOptionalString({ nullable: true })
  nationalId!: string | null

  @ApiString({ description: 'Why the row was rejected.' })
  reason!: string
}

export class CompanyImportTotalsDto {
  @ApiNumber() created!: number
  @ApiNumber() updated!: number
  @ApiNumber() unchanged!: number
  @ApiNumber() markedUnknown!: number
  @ApiNumber() reactivated!: number
  @ApiNumber() invalid!: number
}

export class CompanyImportResultDto {
  @ApiBoolean({
    description: 'false = preview (no writes); true = applied (committed).',
  })
  committed!: boolean

  @ApiOptionalNumber({
    nullable: true,
    description: 'Reporting year (TEKJUAR) from the file, if consistent.',
  })
  year!: number | null

  @ApiNumber({ description: 'Notice from a soft issue, e.g. an unresolved postcode.' })
  noticeCount!: number

  @ApiDtoArray(CompanyImportRowResultDto)
  created!: CompanyImportRowResultDto[]

  @ApiDtoArray(CompanyImportRowResultDto)
  updated!: CompanyImportRowResultDto[]

  @ApiDtoArray(CompanyImportRowResultDto)
  unchanged!: CompanyImportRowResultDto[]

  @ApiDtoArray(CompanyImportRowResultDto)
  markedUnknown!: CompanyImportRowResultDto[]

  @ApiDtoArray(CompanyImportRowResultDto)
  reactivated!: CompanyImportRowResultDto[]

  @ApiDtoArray(CompanyImportErrorDto)
  invalid!: CompanyImportErrorDto[]
}
